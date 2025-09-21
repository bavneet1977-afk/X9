import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Plus, Edit, Trash2, Users, Calendar, MapPin, Clock, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const ClassesSection: React.FC = () => {
  const { user } = useAuth();
  const { classes, setClasses, students, faculty } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    day: '',
    batch: '',
    period: '',
    teacherEmail: '',
    facultyId: '',
    schedule: '',
    room: '',
    semester: ''
  });

  const handleAddClass = () => {
    if (user?.role === 'admin' || user?.role === 'faculty') {
      const newClass = {
        id: `CLS${Date.now()}`,
        ...formData,
        facultyId: user.role === 'faculty' ? user.id : formData.facultyId,
        studentIds: []
      };
      setClasses([...classes, newClass]);
      setShowAddModal(false);
      setFormData({
        name: '',
        subject: '',
        day: '',
        batch: '',
        period: '',
        teacherEmail: '',
        facultyId: '',
        schedule: '',
        room: '',
        semester: ''
      });
    }
  };

  const handleEditClass = () => {
    if (selectedClass && (user?.role === 'admin' || user?.role === 'faculty')) {
      const updatedClasses = classes.map(cls => 
        cls.id === selectedClass.id 
          ? { ...cls, ...formData }
          : cls
      );
      setClasses(updatedClasses);
      setShowEditModal(false);
      setSelectedClass(null);
      setFormData({
        name: '',
        subject: '',
        day: '',
        batch: '',
        period: '',
        teacherEmail: '',
        facultyId: '',
        schedule: '',
        room: '',
        semester: ''
      });
    }
  };

  const handleDeleteClass = (classId: string) => {
    if (user?.role === 'admin') {
      const updatedClasses = classes.filter(cls => cls.id !== classId);
      setClasses(updatedClasses);
    }
  };

  const openEditModal = (cls: any) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      subject: cls.subject,
      day: cls.day || '',
      batch: cls.batch || '',
      period: cls.period || '',
      teacherEmail: cls.teacherEmail || '',
      facultyId: cls.facultyId,
      schedule: cls.schedule,
      room: cls.room,
      semester: cls.semester
    });
    setShowEditModal(true);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (result) => {
        const csvData = result.data as any[];
        const headers = csvData[0];
        const newClasses = csvData.slice(1).map((row: any[], index: number) => {
          const classData: any = {};
          headers.forEach((header: string, headerIndex: number) => {
            classData[header.toLowerCase().replace(' ', '')] = row[headerIndex];
          });
          return {
            id: `CSV${Date.now()}${index}`,
            name: classData.name || '',
            subject: classData.subject || '',
            day: classData.day || '',
            batch: classData.batch || '',
            period: classData.period || '',
            teacherEmail: classData.teacheremail || classData.teacher_email || '',
            facultyId: classData.facultyid || classData.faculty || '',
            schedule: classData.schedule || '',
            room: classData.room || '',
            semester: classData.semester || '',
            studentIds: []
          };
        }).filter((cls: any) => cls.name);

        setClasses([...classes, ...newClasses]);
        setShowImportModal(false);
      },
      header: false,
      skipEmptyLines: true
    });
  };

  const exportToExcel = () => {
    const exportData = classes.map(cls => {
      const facultyMember = faculty.find(f => f.id === cls.facultyId);
      return {
        'Class ID': cls.id,
        'Class Name': cls.name,
        'Subject': cls.subject,
        'Day': cls.day,
        'Batch': cls.batch,
        'Period': cls.period,
        'Teacher Email': cls.teacherEmail,
        'Faculty': facultyMember?.name || 'Unassigned',
        'Schedule': cls.schedule,
        'Room': cls.room,
        'Semester': cls.semester,
        'Student Count': cls.studentIds.length
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Classes');
    XLSX.writeFile(wb, `classes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredClasses = user?.role === 'faculty' 
    ? classes.filter(cls => cls.facultyId === user.id)
    : classes;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('classes.title')}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('classes.import_csv')}
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            {t('classes.export_excel')}
          </button>
          {(user?.role === 'admin' || user?.role === 'faculty') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('classes.add_class')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => {
          const facultyMember = faculty.find(f => f.id === cls.facultyId);
          
          return (
            <div key={cls.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {cls.name}
                </h3>
                {(user?.role === 'admin' || (user?.role === 'faculty' && cls.facultyId === user.id)) && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">{t('classes.subject')}:</span> {cls.subject}</p>
                <p><span className="font-medium">{t('classes.day')}:</span> {cls.day}</p>
                <p><span className="font-medium">{t('classes.batch')}:</span> {cls.batch}</p>
                <p><span className="font-medium">{t('classes.period')}:</span> {cls.period}</p>
                <p><span className="font-medium">{t('classes.teacher_email')}:</span> {cls.teacherEmail}</p>
                <p><span className="font-medium">{t('faculty.title')}:</span> {facultyMember?.name || 'Unassigned'}</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {cls.schedule}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {cls.room}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {cls.semester}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {cls.studentIds.length} {t('classes.students_enrolled')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {t('classes.add_class')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('classes.class_name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('classes.subject')}
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('classes.day')}
                </label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({...formData, day: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t('common.select')} {t('classes.day')}</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('classes.batch')}
                </label>
                <input
                  type="text"
                  value={formData.batch}
                  onChange={(e) => setFormData({...formData, batch: e.target.value})}
                  placeholder="e.g., A, B, C"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('classes.period')}
                </label>
                <input
                  type="text"
                  value={formData.period}
                  onChange={(e) => setFormData({...formData, period: e.target.value})}
                  placeholder="e.g., 1st, 2nd, 3rd"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('classes.teacher_email')}
                </label>
                <input
                  type="email"
                  value={formData.teacherEmail}
                  onChange={(e) => setFormData({...formData, teacherEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('faculty.title')}
                  </label>
                  <select
                    value={formData.facultyId}
                    onChange={(e) => setFormData({...formData, facultyId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('common.select')} {t('faculty.title')}</option>
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('classes.schedule')}
                </label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  placeholder="e.g., Mon, Wed, Fri - 10:00 AM"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('classes.room')}
                </label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({...formData, room: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('classes.semester')}
                </label>
                <input
                  type="text"
                  value={formData.semester}
                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddClass}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                {t('classes.add_class')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Class
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Faculty
                  </label>
                  <select
                    value={formData.facultyId}
                    onChange={(e) => setFormData({...formData, facultyId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Faculty</option>
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule
                </label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({...formData, room: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester
                </label>
                <input
                  type="text"
                  value={formData.semester}
                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditClass}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Update Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {t('classes.import_csv')}
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload a CSV file with the following columns:
                <br />Name, Subject, Day, Batch, Period, Teacher Email, Schedule, Room, Semester
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesSection;