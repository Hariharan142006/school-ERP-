import mongoose from 'mongoose';
import ClassModel from '../models/Class';

/**
 * Resolves one or more class identifiers (ObjectIds or string representations like "10-A", "Grade 10-A", "Grade 10")
 * into an array of valid mongoose.Types.ObjectId.
 * Guaranteed never to throw a CastError.
 */
export const resolveClassIds = async (input: unknown): Promise<mongoose.Types.ObjectId[]> => {
  if (!input) return [];

  const rawValues: string[] = Array.isArray(input)
    ? input.map(v => String(v || '').trim()).filter(Boolean)
    : [String(input).trim()].filter(Boolean);

  const resolvedIds: mongoose.Types.ObjectId[] = [];

  for (const val of rawValues) {
    if (!val || val === 'undefined' || val === 'null' || val === 'all' || val === 'ALL') continue;

    // 1. If it's a valid 24-character hexadecimal ObjectId
    if (mongoose.Types.ObjectId.isValid(val) && /^[0-9a-fA-F]{24}$/.test(val)) {
      resolvedIds.push(new mongoose.Types.ObjectId(val));
      continue;
    }

    // 2. If it's a string like "10-A", "Grade 10-A", "10 A", or "Grade 10"
    try {
      let namePart = '';
      let sectionPart = '';

      if (val.includes('-')) {
        const parts = val.split('-');
        sectionPart = parts.pop()?.trim() || '';
        namePart = parts.join('-').trim();
      } else if (val.includes(' ')) {
        const parts = val.split(/\s+/);
        if (parts.length > 1) {
          sectionPart = parts.pop()?.trim() || '';
          namePart = parts.join(' ').trim();
        } else {
          namePart = val;
        }
      } else {
        namePart = val;
      }

      const queryConditions: any = {};
      if (sectionPart) {
        queryConditions.section = new RegExp(`^${sectionPart}$`, 'i');
      }

      if (namePart) {
        const numberOnly = namePart.replace(/^Grade\s*/i, '').trim();
        queryConditions.$or = [
          { name: new RegExp(`^${namePart}$`, 'i') },
          { name: new RegExp(`^Grade\\s*${numberOnly}$`, 'i') },
          { name: new RegExp(`^${numberOnly}$`, 'i') },
          { name: new RegExp(namePart, 'i') }
        ];
      }

      const matchingClasses = await ClassModel.find(queryConditions).select('_id');
      for (const cls of matchingClasses) {
        resolvedIds.push(cls._id as mongoose.Types.ObjectId);
      }
    } catch (err) {
      console.warn('[classResolver] Error resolving class identifier:', val, err);
    }
  }

  // Deduplicate ObjectIds
  const seen = new Set<string>();
  return resolvedIds.filter(id => {
    const s = id.toString();
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
};
