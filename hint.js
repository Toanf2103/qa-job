async function callGemini(prompt) {
  const apiKey = "AIzaSyAggdXn4MO1IZNyolYF8L_99zyu0QFMNM0";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Lỗi Gemini: ${data.error?.message || "Không xác định"}`);
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return extractSkills(content);
  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    throw error;
  }
}

function extractSkills(content) {
  try {
    // Thử tìm mảng JSON trong nội dung
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Nếu không phân tích được JSON, tiếp tục xuống các phương pháp khác
      }
    }

    // Thử phân tích toàn bộ nội dung nếu đó là JSON
    try {
      const parsedJson = JSON.parse(content);
      if (Array.isArray(parsedJson)) {
        return parsedJson;
      }
    } catch {
      // Nếu không phải JSON, tiếp tục xuống phương pháp khác
    }

    // Trích xuất các dòng bắt đầu bằng dấu - hoặc số.
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 && (line.startsWith("-") || /^\d+\./.test(line))
      )
      .map((line) => line.replace(/^-|\d+\.\s*/, "").trim());

    if (lines.length > 0) {
      return lines;
    }

    // Nếu không có kết quả, phân tách bằng dấu xuống dòng và lọc các dòng trống
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (error) {
    console.error("Lỗi khi trích xuất kỹ năng:", error);
    // Nếu mọi cách đều thất bại, trả về nội dung gốc trong một mảng
    return [content];
  }
}

async function getJobSkills(jobTitle, hintCount = 10) {
  try {
    const prompt = `Liệt kê ${hintCount} kỹ năng quan trọng và cần thiết nhất cho ngành nghề "${jobTitle}".
        Trả về một mảng JSON chứa các chuỗi, mỗi chuỗi là một kỹ năng, không có giải thích hay nội dung nào khác.
        Ví dụ định dạng trả về: ["Kỹ năng 1", "Kỹ năng 2", "Kỹ năng 3", ...]`;
    // Gọi API tương ứng
    return await callGemini(prompt);
  } catch (error) {
    console.error("Lỗi khi lấy kỹ năng:", error);
    throw error;
  }
}

getJobSkills("IT", 10)
  .then((skills) => console.log(skills))
  .catch((err) => console.error(err));
