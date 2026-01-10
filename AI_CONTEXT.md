# PROJECT: LIFE OS PRO

## 1. Mục tiêu
Ứng dụng quản lý công việc cá nhân (Productivity App) tập trung vào tính kỷ luật, Pomodoro và quản lý dự án. Hướng tới việc "Gamification" (trò chơi hóa) cuộc sống để tăng năng suất.

## 2. Tech Stack
-   **Frontend**: Next.js 14 (App Router), React, Tailwind CSS.
-   **Backend/DB**: Supabase (PostgreSQL).
-   **Icons**: Lucide React.
-   **State**: Local State + React Hooks (useGoals, useGamification) + React Hot Toast.

## 3. Cấu trúc Database (Supabase)
Table: `goals`
-   `id` (bigint, PK): ID định danh.
-   `created_at` (timestamp): Thời gian tạo.
-   `text` (text): Tên task hoặc tên dự án.
-   `done` (boolean): Trạng thái hoàn thành.
-   `target_date` (date, nullable): Ngày thực hiện (nếu null & có parent_id -> Backlog).
-   `category` (text): 'work', 'health', 'study', 'other'...
-   `priority` (int): 1 (Thấp), 2 (Vừa), 3 (Gấp).
-   `estimated_minutes` (int): Tổng thời gian dự kiến.
-   `focus_span` (int): Thời gian 1 phiên (25/45/60).
-   `mode` (text): 'normal' | 'strict'.
-   `type` (text): 'daily' | 'study' | 'project' | 'project_task'.
-   `parent_id` (bigint, FK): Link tới project cha (cho task con).

Table: `profiles`
-   `id` (uuid): Link tới auth.users.
-   `xp` (int): Điểm kinh nghiệm.
-   `level` (int): Cấp độ người dùng.
-   `streak` (int): Chuỗi ngày liên tục.

## 4. Quy ước Code (Conventions)
-   **Components**: Dùng Functional Components, ưu tiên chia nhỏ (TaskItem, ProjectManager).
-   **Hooks**: Logic phức tạp tách ra Custom Hooks (`useGoals.ts`, `useGamification.ts`).
-   **Performance**: Memoize các hàm fetch (`useCallback`), hạn chế render thừa.
-   **UI**: Dark Mode là mặc định hoặc ưu tiên cao. Design style: Modern, Clean, Glassmorphism.

## 5. Trạng thái hiện tại (Current Status)
-   **Hoàn thiện**:
    -   CRUD Task cá nhân (Daily).
    -   Pomodoro Timer, Strict Mode (khóa UI).
    -   Gamification (XP, Level Up, Streak).
    -   **Project Management**: Tạo dự án, thêm backlog, delete safe (cascade), pick task to day.
    -   **System Robustness**: Global Error Handling, 404 Page, Input Validation, Optimistic UI.
-   **Đang phát triển/Cần làm**:
    -   Recurring Tasks (Task lặp lại).
    -   Analytics Dashboard (Biểu đồ thống kê chi tiết).
    -   Authentication (Phân quyền sâu hơn).

👉 **LƯU Ý QUAN TRỌNG**: Khi bắt đầu session mới, hãy đọc file này để nắm context mà không cần scan toàn bộ project.
