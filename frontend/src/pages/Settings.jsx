import React from 'react';
import { Bot, LayoutTemplate, ShieldCheck, Sparkles } from 'lucide-react';

const cards = [
  {
    icon: LayoutTemplate,
    title: 'Thiết lập không gian vẽ',
    description:
      'Editor hiện hỗ trợ bố cục radial, lịch sử sơ đồ đã lưu và luồng tạo sơ đồ trống nhanh để bắt đầu lại mà không làm vỡ trạng thái React Flow.',
  },
  {
    icon: Bot,
    title: 'Chế độ trợ lý AI',
    description:
      'Trợ lý AI giờ có thể đọc trạng thái canvas hiện tại rồi trả về cập nhật có cấu trúc để thêm hoặc chỉnh sửa graph theo ngữ cảnh.',
  },
  {
    icon: ShieldCheck,
    title: 'Phiên đăng nhập và lưu trữ',
    description:
      'Mindmap được lưu theo từng tài khoản thông qua các API FastAPI có xác thực bằng access token hiện tại của bạn.',
  },
];

export default function Settings() {
  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.1),_transparent_38%),linear-gradient(180deg,_#020617,_#0f172a_50%,_#020617)] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Cài đặt không gian vẽ
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Cấu hình trình biên tập</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Đây là trang tổng hợp các năng lực hiện có của ứng dụng. Phần editor chính vẫn tập trung vào việc tạo sơ đồ, quản lý lịch sử làm việc và đồng sáng tạo với AI ngay trên canvas.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, description }) => (
            <section
              key={title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
