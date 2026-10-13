const requiredEnvVars = [] as const;
const optionalEnvVars = {
  MONGO_URI: 'mongodb+srv://ambiotestportal_db_user:kFrqZ2JtJApBG4u7@cluster0.9zaccms.mongodb.net/school-erp?retryWrites=true&w=majority&appName=Cluster0',
  JWT_SECRET: 'change-this-in-production',
  PORT: '5000',
  NODE_ENV: 'development',
  BREVO_API_KEY: '',
  BREVO_SENDER_EMAIL: '',
} as const;

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  // Set defaults for optional vars
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) process.env[key] = defaultValue;
  }
  if (process.env.JWT_SECRET === 'change-this-in-production' && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be changed in production!');
  }
};

export const env = {
  get MONGO_URI() { return process.env.MONGO_URI || 'mongodb+srv://ambiotestportal_db_user:kFrqZ2JtJApBG4u7@cluster0.9zaccms.mongodb.net/school-erp?retryWrites=true&w=majority&appName=Cluster0'; },
  get JWT_SECRET() { return process.env.JWT_SECRET || 'change-this-in-production'; },
  get PORT() { return parseInt(process.env.PORT || '5000'); },
  get NODE_ENV() { return process.env.NODE_ENV || 'development'; },
  get BREVO_API_KEY() { return process.env.BREVO_API_KEY || ''; },
  get BREVO_SENDER_EMAIL() { return process.env.BREVO_SENDER_EMAIL || ''; },
};

