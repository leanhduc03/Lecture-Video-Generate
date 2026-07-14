import { useState } from 'react';
import { MdExpandMore, MdCheckCircle, MdLightbulb, MdWarning, MdEditDocument, MdUploadFile, MdLocalLibrary, MdFaceRetouchingNatural } from 'react-icons/md';

const UserGuide = () => {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const guideData = [
    {
      title: "Tạo PowerPoint từ văn bản",
      icon: <MdEditDocument className="text-2xl" />,
      color: "from-purple-500 to-pink-600",
      steps: [
        {
          title: "Nhập nội dung",
          content: "Nhập hoặc dán văn bản bài giảng của bạn vào ô text. Hệ thống sẽ tự động phân tích và tạo slide."
        },
        {
          title: "Tùy chỉnh slide",
          content: "Xem trước các slide đã tạo, có thể tải về để chỉnh sửa nội dung, thêm hình ảnh hoặc điều chỉnh bố cục nếu cần."
        },
        {
          title: "Tải lên slide đã chỉnh sửa",
          content: "Tải lại slide đã chỉnh sửa lên hệ thống để tiếp tục quá trình tạo video."
        },
        {
          title: "Chỉnh sửa nội dung thuyết minh",
          content: "Nhập nội dung thuyết minh cho từng slide."
        },
        {
          title: "Cấu hình đa phương tiện",
          content: "Chọn video giảng viên và giọng đọc phù hợp từ danh sách có sẵn trên hệ thống. Hoặc sử dụng video ghép mặt và audio giọng nói của riêng bạn để làm thuyết minh cho video."
        },
        {
          title: "Tạo video",
          content: "Nhấn 'Tạo Video thuyết minh' và đợi hệ thống xử lý. Thời gian xử lý phụ thuộc vào độ dài nội dung."
        }
      ]
    },
    {
      title: "Upload PowerPoint có sẵn",
      icon: <MdUploadFile className="text-2xl" />,
      color: "from-teal-500 to-green-600",
      steps: [
        {
          title: "Chuẩn bị file PowerPoint",
          content: "Đảm bảo file .pptx của bạn có định dạng chuẩn, dung lượng không quá 50MB."
        },
        {
          title: "Upload file",
          content: "Kéo thả hoặc chọn file PowerPoint từ máy tính. Hệ thống sẽ tự động phân tích các slide."
        },
        {
          title: "Chỉnh sửa nội dung thuyết minh",
          content: "Nhập nội dung thuyết minh cho từng slide."
        },
        {
          title: "Cấu hình đa phương tiện",
          content: "Chọn video giảng viên và giọng đọc phù hợp từ danh sách có sẵn trên hệ thống.\nHoặc sử dụng video ghép mặt và audio giọng nói của riêng bạn để làm thuyết minh cho video."
        },
        {
          title: "Tạo video",
          content: "Nhấn 'Tạo Video thuyết minh' và đợi hệ thống xử lý. Thời gian xử lý phụ thuộc vào độ dài nội dung."
        }
      ]
    },
        {
      title: "Tạo video ghép mặt",
      icon: <MdFaceRetouchingNatural className="text-2xl" />,
      color: "from-blue-500 to-purple-600",
      steps: [
        {
          title: "Chọn ảnh  và video đầu vào",
          content: "Chọn ảnh chân dung và video từ thư viện đã tải lên hoặc tải lên ảnh và video mới của riêng bạn."
        },
        {
          title: "Tạo video ghép mặt",
          content: "Nhấn nút 'Tạo Video ghép mặt' và đợi hệ thống xử lý."
        }
      ]
    },
    {
      title: "Quản lý thư viện",
      icon: <MdLocalLibrary className="text-2xl" />,
      color: "from-orange-500 to-red-600",
      steps: [
        {
          title: "Thư viện hình ảnh",
          content: "Upload và quản lý hình ảnh đã tải lên. Hỗ trợ JPG, PNG."
        },
        {
          title: "Thư viện âm thanh",
          content: "Upload audio giọng nói kèm theo văn bản tương ứng. Hỗ trợ MP3, WAV."
        },
        {
          title: "Quản lý video",
          content: "Lưu trữ và tổ chức các video đã tải lên. Hỗ trợ MP4, MOV."
        }
      ]
    }
  ];

  const tips = [
    {
      icon: <MdLightbulb className="text-yellow-600 text-xl" />,
      title: "Mẹo hay",
      content: "Sử dụng văn bản có cấu trúc rõ ràng với tiêu đề và nội dung phân đoạn để AI tạo slide tốt hơn."
    },
    {
      icon: <MdWarning className="text-orange-600 text-xl" />,
      title: "Lưu ý",
      content: "Thời gian xử lý video phụ thuộc vào số lượng slide và độ phức tạp. Vui lòng không tắt trình duyệt khi đang xử lý."
    },
    {
      icon: <MdCheckCircle className="text-green-600 text-xl" />,
      title: "Chất lượng tốt nhất",
      content: "Sử dụng hình ảnh có độ phân giải cao và nội dung văn bản rõ ràng, không lỗi chính tả."
    }
  ];

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4">
      {/* Header */}
      <div className="mb-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-1">Hướng dẫn sử dụng</h1>
      <p className="text-slate-600 text-base">
        Tìm hiểu cách sử dụng công cụ tạo video AI một cách hiệu quả nhất
      </p>
      </div>

      {/* Guide Sections */}
      <div className="space-y-3 mb-4">
      {guideData.map((section, index) => (
        <div
        key={index}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
        >
        <button
          onClick={() => toggleSection(index)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-r ${section.color} text-white`}>
            {section.icon}
          </div>
          <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
          </div>
          <MdExpandMore
          className={`text-2xl text-slate-400 transition-transform ${expandedSection === index ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSection === index && (
          <div className="px-4 pb-4 space-y-3">
          {section.steps.map((step, stepIndex) => (
            <div key={stepIndex} className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
              {stepIndex + 1}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-0.5">{step.title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{step.content}</p>
            </div>
            </div>
          ))}
          </div>
        )}
        </div>
      ))}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Mẹo và lưu ý quan trọng</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {tips.map((tip, index) => (
        <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
          {tip.icon}
          <h3 className="font-bold text-slate-900">{tip.title}</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">{tip.content}</p>
        </div>
        ))}
      </div>
      </div>
    </main>
  );
};

export default UserGuide;