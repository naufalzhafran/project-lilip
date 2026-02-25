import * as pdfjsLib from "pdfjs-dist";
import dayjs from "dayjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export interface ParsedRecruitmentData {
  candidate_name: string;
  candidate_role: string;
  company_name: string;
  interview_datetime: string | null;
  report_sent_datetime: string | null;
}

function extractText(textItems: { str: string }[]): string {
  return textItems.map((item) => item.str).join(" ");
}

function findValue(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const nextFields = [
      "Age", "Current", "Notice", "Expected", "Religion", "Height", "Visible", 
      "Smoking", "Drinking", "Any", "Existing", "Interviewed", "Report", 
      "Consideration", "Key", "Job Title"
    ];
    
    for (const nextField of nextFields) {
      const pattern = new RegExp(`${label}(.+?)${nextField}`, "i");
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    const fallbackPattern = new RegExp(`${label}(.+?)(?:\\n|$)`, "i");
    const fallbackMatch = text.match(fallbackPattern);
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1].trim();
    }
  }
  return null;
}

function findDate(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const pattern = new RegExp(`${label}(?:\\s*:?\\s*)?(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})(?:\\s*\\((\\d{1,2}):(\\d{2})\\))?`, "i");
    const match = text.match(pattern);
    if (match && match[1] && match[2] && match[3]) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      let year = parseInt(match[3]);
      if (year < 100) year += 2000;
      
      let hours = 0;
      let minutes = "00";
      
      if (match[4] && match[5]) {
        hours = parseInt(match[4]);
        minutes = match[5];
      }
      
      try {
        const dt = dayjs(new Date(year, month - 1, day, hours, parseInt(minutes)));
        if (dt.isValid()) {
          return dt.format("YYYY-MM-DDTHH:mm");
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

export async function parseRecruitmentPDF(
  file: File,
): Promise<ParsedRecruitmentData> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += extractText(textContent.items as { str: string }[]) + "\n";
  }

  const candidateName = findValue(fullText, ["Candidates Name"]);
  
  const currentJobTitleMatch = fullText.match(/Current\s+Job\s+Title\s+(.+?)(?:\s+Job\s+Title\s+|\s+Current\s+Salary\s+|$)/i);
  let candidateRole = currentJobTitleMatch ? currentJobTitleMatch[1].trim() : null;
  
  if (!candidateRole) {
    const jobTitleMatch = fullText.match(/(?:^|\s)Job\s+Title\s+(.+?)(?:\s+Current\s+Salary\s+|$)/i);
    candidateRole = jobTitleMatch ? jobTitleMatch[1].trim() : null;
  }
  
  const clientsNameMatch = fullText.match(/Clients\s+Name\s+(.+?)(?:Current\s+Job\s+Title|$)/i);
  const companyName = clientsNameMatch ? clientsNameMatch[1].trim() : findValue(fullText, ["Current Employer"]);

  const interviewDate = findDate(fullText, ["Interviewed on"]);
  const reportDate = findDate(fullText, ["Report Created on"]);

  return {
    candidate_name: candidateName || "",
    candidate_role: candidateRole || "",
    company_name: companyName || "",
    interview_datetime: interviewDate,
    report_sent_datetime: reportDate,
  };
}
