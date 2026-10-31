import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

export interface StudentChild {
  id: string;
  _id?: string;
  name: string;
  admissionNo: string;
  rollNo: string;
  classId?: string;
  grade: string;
  section: string;
  bloodGroup?: string;
  dob?: string;
  busRoute?: string;
  gender?: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
}

interface AuthContextType {
  user: any;
  token: string | null;
  children: StudentChild[];
  selectedStudent: StudentChild | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setSelectedStudent: (child: StudentChild) => void;
}

const defaultStudent: StudentChild = {
  id: 'sample_student_1',
  _id: 'sample_student_1',
  name: 'Karthik Murugan',
  admissionNo: 'ADM-1001',
  rollNo: '1001',
  grade: '10',
  section: 'A',
  bloodGroup: 'O+ Positive',
  dob: '14 March 2011',
  busRoute: 'Route 14: Anna Nagar Express',
  gender: 'Male',
  fatherName: 'Murugan Sundaram',
  motherName: 'Meenakshi Murugan',
  address: 'Plot 42, 2nd Main Road, Anna Nagar, Chennai - 600040',
};

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [studentList, setStudentList] = useState<StudentChild[]>([defaultStudent]);
  const [selectedStudent, setSelectedStudent] = useState<StudentChild | null>(defaultStudent);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('parent_token');
      const storedUser = await AsyncStorage.getItem('parent_user');
      const storedChild = await AsyncStorage.getItem('parent_selected_child');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (storedChild) {
          setSelectedStudent(JSON.parse(storedChild));
        }
        await fetchParentChildren(parsedUser.id || parsedUser._id);
      }
    } catch (e) {
      console.error('Failed to load parent session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParentChildren = async (_parentId?: string) => {
    try {
      const res = await api.get('/api/students/children');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mappedList: StudentChild[] = res.data.map((item: any) => ({
          id: item._id || item.id,
          _id: item._id || item.id,
          name: item.user?.name || item.name || 'Student',
          admissionNo: item.admissionNumber || 'ADM-1001',
          rollNo: item.rollNumber || '1001',
          classId: item.enrolledClass?._id || item.enrolledClass?.id || (typeof item.enrolledClass === 'string' ? item.enrolledClass : undefined),
          grade: item.enrolledClass?.name || 'Grade 10',
          section: item.enrolledClass?.section || 'A',
          bloodGroup: item.bloodGroup || 'O+',
          gender: item.gender || 'Male',
          dob: item.dob ? new Date(item.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '14 May 2010',
          busRoute: item.busNumber ? `Bus ${item.busNumber}` : (item.transportMode === 'Bus' ? 'Route 14: Anna Nagar Express' : 'Self / Walking'),
          fatherName: item.fatherName || '',
          motherName: item.motherName || '',
          address: item.address || '',
        }));
        setStudentList(mappedList);
        setSelectedStudent((current) => {
          if (current && mappedList.some((c) => c.id === current.id)) {
            return current;
          }
          AsyncStorage.setItem('parent_selected_child', JSON.stringify(mappedList[0]));
          return mappedList[0];
        });
      }
    } catch (error) {
      console.log('Using default child profile context:', error);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const { token: jwtToken, user: userData } = res.data;

      if (userData.role !== 'PARENT' && userData.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'Access denied. Only Parent accounts can access this app.' };
      }

      setToken(jwtToken);
      setUser(userData);

      await AsyncStorage.setItem('parent_token', jwtToken);
      await AsyncStorage.setItem('parent_user', JSON.stringify(userData));

      await fetchParentChildren(userData.id || userData._id);

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Network or login error. Please check credentials.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setSelectedStudent(defaultStudent);
    await AsyncStorage.removeItem('parent_token');
    await AsyncStorage.removeItem('parent_user');
    await AsyncStorage.removeItem('parent_selected_child');
  };

  const handleSelectStudent = (child: StudentChild) => {
    setSelectedStudent(child);
    AsyncStorage.setItem('parent_selected_child', JSON.stringify(child));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        children: studentList,
        selectedStudent,
        isLoading,
        login,
        logout,
        setSelectedStudent: handleSelectStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
