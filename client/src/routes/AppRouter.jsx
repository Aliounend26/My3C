import { Navigate, Route, Routes } from "react-router-dom";
import { Loader } from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";
import { AdminLayout } from "../layouts/AdminLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { SuperAdminLayout } from "../layouts/SuperAdminLayout";
import { TeacherLayout } from "../layouts/TeacherLayout";
import { AdminCalendarPage } from "../pages/admin/AdminCalendarPage";
import { AdminClassesPage } from "../pages/admin/AdminClassesPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminProfilePage } from "../pages/admin/AdminProfilePage";
import { AdminSectionsPage } from "../pages/admin/AdminSectionsPage";
import { AdminTeachersPage } from "../pages/admin/AdminTeachersPage";
import { AttendancesPage } from "../pages/admin/AttendancesPage";
import { CoursesPage } from "../pages/admin/CoursesPage";
import { FormationsPage } from "../pages/admin/FormationsPage";
import { QRCodePage } from "../pages/admin/QRCodePage";
import { ReportsPage } from "../pages/admin/ReportsPage";
import { StudentsPage } from "../pages/admin/StudentsPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { PublicHomePage } from "../pages/PublicHomePage";
import { QRAttendancePage } from "../pages/QRAttendancePage";
import { MyAttendancesPage } from "../pages/student/MyAttendancesPage";
import { MyCoursesPage } from "../pages/student/MyCoursesPage";
import { ProfilePage } from "../pages/student/ProfilePage";
import { ProgressPage } from "../pages/student/ProgressPage";
import { ScannerPage } from "../pages/student/ScannerPage";
import { StudentCalendarPage } from "../pages/student/StudentCalendarPage";
import { StudentCourseDetailPage } from "../pages/student/StudentCourseDetailPage";
import { StudentDashboardPage } from "../pages/student/StudentDashboardPage";
import { StudentMessagesPage } from "../pages/student/StudentMessagesPage";
import { StudentQuizResultsPage } from "../pages/student/StudentQuizResultsPage";
import { StudentSectionDetailPage } from "../pages/student/StudentSectionDetailPage";
import { StudentLessonPage } from "../pages/student/StudentLessonPage";
import { QuizPlayerPage } from "../pages/student/QuizPlayerPage";
import { SuperAdminDashboardPage } from "../pages/superadmin/SuperAdminDashboardPage";
import { SuperAdminClassesPage } from "../pages/superadmin/SuperAdminClassesPage";
import { SuperAdminContentPage } from "../pages/superadmin/SuperAdminContentPage";
import { SuperAdminStatisticsPage } from "../pages/superadmin/SuperAdminStatisticsPage";
import { SuperAdminUsersPage } from "../pages/superadmin/SuperAdminUsersPage";
import { TeacherAnnouncementsPage } from "../pages/teacher/TeacherAnnouncementsPage";
import { TeacherCoursesPage } from "../pages/teacher/TeacherCoursesPage";
import { TeacherCourseDetailPage } from "../pages/teacher/TeacherCourseDetailPage";
import { TeacherDashboardPage } from "../pages/teacher/TeacherDashboardPage";
import { TeacherLessonsPage } from "../pages/teacher/TeacherLessonsPage";
import { TeacherMessagesPage } from "../pages/teacher/TeacherMessagesPage";
import { TeacherQuizzesPage } from "../pages/teacher/TeacherQuizzesPage";
import { TeacherResourcesPage } from "../pages/teacher/TeacherResourcesPage";
import { TeacherSectionsPage } from "../pages/teacher/TeacherSectionsPage";
import { TeacherStudentsPage } from "../pages/teacher/TeacherStudentsPage";
import { ProtectedRoute } from "./ProtectedRoute";

const HomeEntry = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Chargement..." />;
  if (!user) return <PublicHomePage />;
  if (user.role === "superadmin") return <Navigate to="/superadmin" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "teacher") return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<HomeEntry />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/qr-attendance" element={<QRAttendancePage />} />

    <Route element={<ProtectedRoute allowedRoles={["superadmin"]} />}>
      <Route path="/superadmin" element={<SuperAdminLayout />}>
        <Route index element={<SuperAdminDashboardPage />} />
        <Route path="users" element={<SuperAdminUsersPage />} />
        <Route path="admins" element={<SuperAdminUsersPage lockedRole="admin" title="Gestion des admins" description="Creez, activez et supervisez les comptes admins sans exposer le niveau SuperAdmin." />} />
        <Route path="teachers" element={<SuperAdminUsersPage lockedRole="teacher" title="Gestion des formateurs" description="Supervisez les formateurs, leurs affectations pedagogiques et leurs acces." />} />
        <Route path="students" element={<SuperAdminUsersPage lockedRole="student" title="Gestion des etudiants" description="Pilotez les comptes etudiants, leurs affectations de formation, classe et cours." />} />
        <Route path="formations" element={<FormationsPage />} />
        <Route path="classes" element={<SuperAdminClassesPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="attendances" element={<AttendancesPage />} />
        <Route path="content" element={<SuperAdminContentPage />} />
        <Route path="statistics" element={<SuperAdminStatisticsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="teachers" element={<AdminTeachersPage />} />
        <Route path="formations" element={<FormationsPage />} />
        <Route path="classes" element={<AdminClassesPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="sections" element={<AdminSectionsPage />} />
        <Route path="calendar" element={<AdminCalendarPage />} />
        <Route path="attendances" element={<AttendancesPage />} />
        <Route path="qr-codes" element={<QRCodePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<TeacherDashboardPage />} />
        <Route path="courses" element={<TeacherCoursesPage />} />
        <Route path="courses/:courseId" element={<TeacherCourseDetailPage />} />
        <Route path="students" element={<TeacherStudentsPage />} />
        <Route path="sections" element={<TeacherSectionsPage />} />
        <Route path="lessons" element={<TeacherLessonsPage />} />
        <Route path="resources" element={<TeacherResourcesPage />} />
        <Route path="quizzes" element={<TeacherQuizzesPage />} />
        <Route path="announcements" element={<TeacherAnnouncementsPage />} />
        <Route path="messages" element={<TeacherMessagesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentDashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="courses" element={<MyCoursesPage />} />
        <Route path="courses/:courseId" element={<StudentCourseDetailPage />} />
        <Route path="sections/:sectionId" element={<StudentSectionDetailPage />} />
        <Route path="lessons/:lessonId" element={<StudentLessonPage />} />
        <Route path="quizzes/:quizId" element={<QuizPlayerPage />} />
        <Route path="quiz-results" element={<StudentQuizResultsPage />} />
        <Route path="messages" element={<StudentMessagesPage />} />
        <Route path="calendar" element={<StudentCalendarPage />} />
        <Route path="attendances" element={<MyAttendancesPage />} />
        <Route path="scanner" element={<ScannerPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
