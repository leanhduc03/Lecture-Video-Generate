SLIDE_STRUCTURE_PROMPT = """
            Hãy phân tích nội dung sau và tạo ra cấu trúc slide thuyết trình:
            
            {content}
            
            Yêu cầu:
            1. Tóm tắt nội dung thành {slide_range}
            2. Mỗi slide có tiêu đề rõ ràng và 3-5 điểm chính
            3. Với mỗi slide, hãy trích xuất đoạn nội dung gốc tương ứng để thuyết trình
            4. QUAN TRỌNG: Nội dung thuyết trình (original_content) cho mỗi slide phải giới hạn trong 250 ký tự (bao gồm cả dấu cách và dấu câu)
            5. Nếu nội dung dài hơn 250 ký tự, hãy chia thành nhiều slide hoặc tóm tắt ngắn gọn hơn
            6. Trả về định dạng JSON với cấu trúc:
            {{
                "title": "Tiêu đề tổng thể",
                "slides": [
                    {{
                        "slide_number": 1,
                        "title": "Tiêu đề slide",
                        "content": [
                            "Điểm 1",
                            "Điểm 2",
                            "Điểm 3"
                        ],
                        "original_content": "Đoạn nội dung gốc ngắn gọn để thuyết trình (tối đa 250 ký tự)"
                    }}
                ]
            }}
            
            LƯU Ý: Đảm bảo mỗi "original_content" không vượt quá 250 ký tự để tương thích với hệ thống TTS.
            
            Chỉ trả về JSON, không có text thêm.
            """

SLIDE_CONTENT_REWRITE_BATCH_PROMPT = """
            Bạn là một giảng viên đại học đang biên soạn nội dung bài giảng để dạy cho sinh viên.
            Nhiệm vụ: Viết lại (paraphrase) danh sách các đoạn nội dung slide dưới đây.

            Đầu vào là một JSON List, mỗi item có "id" và "content".
            
            Yêu cầu bắt buộc:
            1. VĂN PHONG GIẢNG DẠY: Sử dụng ngôn ngữ của giảng viên nói với sinh viên: trang trọng, dễ hiểu, có tính hướng dẫn.
            2. KHÔNG VIẾT HOA TOÀN BỘ: Tuyệt đối không viết in hoa toàn bộ câu hoặc cụm từ (NO ALL CAPS). Chỉ viết hoa chữ cái đầu câu và tên riêng.
            3. GIẢI NGHĨA VIẾT TẮT: Nếu gặp từ viết tắt (ví dụ: CNTT, GDP), hãy viết rõ nghĩa trong lần đầu xuất hiện hoặc chuyển sang cách đọc dễ hiểu.
            4. ĐỘ DÀI: Mỗi đoạn viết lại khoảng 150-200 ký tự (20-25 giây đọc).
            
            Format Output (JSON thuần):
            [
                {{
                    "id": <giữ nguyên id đầu vào>,
                    "rewritten_content": "<nội dung đã viết lại>"
                }},
                ...
            ]
            
            Chỉ trả về JSON hợp lệ, không có markdown formatting (```json), không có lời dẫn.
            
            Input Data:
            {content}
            """
