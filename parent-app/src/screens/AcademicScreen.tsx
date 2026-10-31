import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { AcademicIcon, AwardIcon } from '../components/Icons';

interface SubjectMark {
  subjectName: string;
  subjectCode: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  remarks?: string;
  status: 'Pass' | 'Fail';
}

interface ExamGroup {
  id: string;
  examName: string;
  startDate?: string;
  status: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  overallGrade: string;
  overallResult: 'PASS' | 'FAIL';
  subjects: SubjectMark[];
}

export const AcademicScreen = () => {
  const { selectedStudent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [examGroups, setExamGroups] = useState<ExamGroup[]>([]);
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);

  const fetchAcademicResults = async () => {
    const studentId = selectedStudent?.id || selectedStudent?._id;
    if (!studentId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await api.get(`/api/exams/student/${studentId}`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Group results by exam
        const groupMap = new Map<string, ExamGroup>();

        for (const item of res.data) {
          const examObj = item.exam || {};
          const examId = examObj._id || item.exam || 'exam_default';
          const examName = examObj.name || 'Assessment';

          if (!groupMap.has(examId)) {
            groupMap.set(examId, {
              id: examId,
              examName,
              startDate: examObj.startDate ? new Date(examObj.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
              status: examObj.status || 'Completed',
              totalObtained: 0,
              totalMax: 0,
              percentage: 0,
              overallGrade: 'A',
              overallResult: 'PASS',
              subjects: [],
            });
          }

          const group = groupMap.get(examId)!;
          const marksObtained = Number(item.marksObtained) || 0;
          const totalMarks = Number(item.totalMarks) || 100;
          const passThreshold = totalMarks * 0.4;
          const isPass = marksObtained >= passThreshold;

          let grade = item.grade;
          if (!grade) {
            const p = (marksObtained / totalMarks) * 100;
            if (p >= 90) grade = 'O';
            else if (p >= 80) grade = 'A+';
            else if (p >= 70) grade = 'A';
            else if (p >= 60) grade = 'B+';
            else if (p >= 50) grade = 'B';
            else grade = 'C';
          }

          group.totalObtained += marksObtained;
          group.totalMax += totalMarks;
          if (!isPass) group.overallResult = 'FAIL';

          group.subjects.push({
            subjectName: item.subject?.name || 'Subject',
            subjectCode: item.subject?.code || '',
            marksObtained,
            totalMarks,
            grade,
            remarks: item.remarks,
            status: isPass ? 'Pass' : 'Fail',
          });
        }

        const groupsArray = Array.from(groupMap.values()).map(g => {
          const p = g.totalMax > 0 ? (g.totalObtained / g.totalMax) * 100 : 0;
          g.percentage = Number(p.toFixed(1));

          if (g.percentage >= 90) g.overallGrade = 'O (Outstanding)';
          else if (g.percentage >= 80) g.overallGrade = 'A+ (Distinction)';
          else if (g.percentage >= 70) g.overallGrade = 'A (First Class)';
          else if (g.percentage >= 60) g.overallGrade = 'B+ (High Second)';
          else if (g.percentage >= 50) g.overallGrade = 'B (Second Class)';
          else g.overallGrade = 'C (Pass)';

          return g;
        });

        setExamGroups(groupsArray);
      } else {
        setExamGroups([]);
      }
    } catch (e) {
      console.error('Academic results fetch error:', e);
      setExamGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAcademicResults();
  }, [selectedStudent]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAcademicResults();
  };

  const currentExam = examGroups[selectedExamIndex] || null;

  return (
    <View style={styles.container}>
      {/* Sleek Native Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Academic Performance</Text>
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>
              {selectedStudent ? `${selectedStudent.grade}-${selectedStudent.section}` : 'Class'}
            </Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>
          {selectedStudent ? `${selectedStudent.name} • Official Term Assessments` : 'Report Card & Grades'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading verified examination records...</Text>
          </View>
        ) : examGroups.length === 0 ? (
          <View style={styles.emptyCard}>
            <AwardIcon size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Examination Records Found</Text>
            <Text style={styles.emptySub}>Official term marks will appear once published by teachers.</Text>
          </View>
        ) : (
          <>
            {/* Exam Term Selector Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.termScroll}>
              {examGroups.map((exam, index) => {
                const isActive = selectedExamIndex === index;
                return (
                  <TouchableOpacity
                    key={exam.id}
                    style={[styles.termChip, isActive && styles.termChipActive]}
                    onPress={() => setSelectedExamIndex(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.termChipText, isActive && styles.termChipTextActive]}>
                      {exam.examName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Overview Hero Card */}
            {currentExam && (
              <View style={styles.overviewCard}>
                <View style={styles.overviewTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.examMainTitle}>{currentExam.examName}</Text>
                    <Text style={styles.examDateSub}>
                      {currentExam.startDate ? `Conducted on ${currentExam.startDate}` : 'Official Evaluation'}
                    </Text>
                  </View>
                  <View style={[styles.resultBadge, { backgroundColor: currentExam.overallResult === 'PASS' ? '#ECFDF5' : '#FEF2F2' }]}>
                    <Text style={[styles.resultBadgeText, { color: currentExam.overallResult === 'PASS' ? '#059669' : '#DC2626' }]}>
                      {currentExam.overallResult}
                    </Text>
                  </View>
                </View>

                {/* Score Metrics */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricVal}>{currentExam.percentage}%</Text>
                    <Text style={styles.metricLbl}>Percentage</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricCol}>
                    <Text style={[styles.metricVal, { color: '#7C3AED' }]}>
                      {currentExam.totalObtained} / {currentExam.totalMax}
                    </Text>
                    <Text style={styles.metricLbl}>Total Marks</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricCol}>
                    <Text style={[styles.metricVal, { color: '#2563EB' }]}>
                      {currentExam.overallGrade.split(' ')[0]}
                    </Text>
                    <Text style={styles.metricLbl}>Grade</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Subject Marks Breakdown */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Subject Marksheet</Text>
              <Text style={styles.sectionBadge}>{currentExam?.subjects.length} Subjects Evaluated</Text>
            </View>

            {currentExam?.subjects.map((sub, idx) => (
              <View key={sub.subjectName + idx} style={styles.subjectCard}>
                <View style={styles.subjectCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName}>{sub.subjectName}</Text>
                    {sub.subjectCode ? <Text style={styles.subjectCode}>{sub.subjectCode}</Text> : null}
                  </View>
                  <View style={styles.markBadge}>
                    <Text style={styles.markScoreText}>
                      {sub.marksObtained}
                      <Text style={styles.markMaxText}>/{sub.totalMarks}</Text>
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, (sub.marksObtained / sub.totalMarks) * 100)}%`,
                        backgroundColor: (sub.marksObtained / sub.totalMarks) >= 0.75 ? '#10B981' : (sub.marksObtained / sub.totalMarks) >= 0.5 ? '#3B82F6' : '#F59E0B'
                      }
                    ]}
                  />
                </View>

                <View style={styles.subjectFooter}>
                  <Text style={styles.gradeText}>Grade: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{sub.grade}</Text></Text>
                  {sub.remarks ? (
                    <Text style={styles.remarksText} numberOfLines={1}>{sub.remarks}</Text>
                  ) : (
                    <Text style={styles.passLabel}>Result: {sub.status}</Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  classPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  classPillText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 12,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 125, // Extra clearance for floating bottom bar
  },
  termScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  termChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  termChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  termChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  termChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  examMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  examDateSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingTop: 14,
    alignItems: 'center',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  subjectCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  markBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  markScoreText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  markMaxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 12,
    color: '#64748B',
  },
  remarksText: {
    fontSize: 11.5,
    color: '#7C3AED',
    fontStyle: 'italic',
    maxWidth: '60%',
  },
  passLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 36,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
});
