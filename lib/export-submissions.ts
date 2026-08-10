import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportSubmissionItem {
  id: string;
  reference_id: string;
  stage_name: string;
  real_name: string;
  phone: string;
  email: string;
  location: string;
  category: string;
  song_title: string;
  media_link: string;
  release_date: string;
  photo_url?: string | null;
  cover_art_url?: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  submitted_at: string;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
}

interface ExportFilterContext {
  statusFilter?: string;
  categoryFilter?: string;
  searchTerm?: string;
}

/** Formats ISO timestamp to readable string */
function formatDate(isoString: string): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/** Helper to generate sanitized timestamp for file names */
function getFileTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Map submissions to tabular rows */
function prepareExportRows(items: ExportSubmissionItem[]) {
  return items.map((item) => ({
    "Reference ID": item.reference_id,
    "Stage Name": item.stage_name,
    "Real Name": item.real_name,
    Category: item.category,
    "Song Title": item.song_title,
    "Release Date": item.release_date,
    Status: item.status.toUpperCase(),
    Email: item.email,
    Phone: item.phone,
    Location: item.location,
    "Media Link": item.media_link,
    "Artist Photo URL": item.photo_url || "",
    "Cover Art URL": item.cover_art_url || "",
    "Submitted At": formatDate(item.submitted_at),
    Instagram: item.instagram || "",
    Facebook: item.facebook || "",
    TikTok: item.tiktok || "",
    YouTube: item.youtube || "",
    "Rejection Reason": item.rejection_reason || "",
  }));
}

/**
 * Export Submissions to CSV file
 */
export function exportSubmissionsToCSV(
  items: ExportSubmissionItem[],
  filters?: ExportFilterContext
) {
  const rows = prepareExportRows(items);
  if (rows.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Add UTF-8 BOM so Excel opens special characters correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  const statusPart = filters?.statusFilter ? `_${filters.statusFilter}` : "";
  link.setAttribute("download", `BMAA_Submissions${statusPart}_${getFileTimestamp()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Submissions to Excel (.xlsx) file with custom column widths
 */
export function exportSubmissionsToExcel(
  items: ExportSubmissionItem[],
  filters?: ExportFilterContext
) {
  const rows = prepareExportRows(items);
  if (rows.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set intelligent column widths
  const colWidths = [
    { wch: 14 }, // Ref ID
    { wch: 22 }, // Stage Name
    { wch: 22 }, // Real Name
    { wch: 28 }, // Category
    { wch: 25 }, // Song Title
    { wch: 14 }, // Release Date
    { wch: 12 }, // Status
    { wch: 26 }, // Email
    { wch: 16 }, // Phone
    { wch: 18 }, // Location
    { wch: 32 }, // Media Link
    { wch: 35 }, // Artist Photo URL
    { wch: 35 }, // Cover Art URL
    { wch: 20 }, // Submitted At
    { wch: 20 }, // Instagram
    { wch: 20 }, // Facebook
    { wch: 20 }, // TikTok
    { wch: 20 }, // YouTube
    { wch: 30 }, // Rejection Reason
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

  const statusPart = filters?.statusFilter ? `_${filters.statusFilter}` : "";
  const filename = `BMAA_Submissions${statusPart}_${getFileTimestamp()}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Export Submissions to styled PDF document
 */
export function exportSubmissionsToPDF(
  items: ExportSubmissionItem[],
  filters?: ExportFilterContext
) {
  if (items.length === 0) return;

  // Create A4 landscape document for wide tables
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Color Tokens (BMAA Dark & Gold Brand)
  const bgDark = [17, 8, 4]; // #110804
  const goldPrimary = [210, 148, 46]; // #D2942E
  const textWhite = [245, 241, 235]; // #F5F1EB
  const borderBrown = [108, 60, 10]; // #6C3C0A
  const surfaceDark = [26, 18, 12]; // #1A120C

  // Header background bar
  doc.setFillColor(bgDark[0], bgDark[1], bgDark[2]);
  doc.rect(0, 0, 297, 24, "F");

  // Gold accent bar under header
  doc.setFillColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.rect(0, 24, 297, 1.5, "F");

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.text("BMAA 2026 — SUBMISSIONS REPORT", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text(`Generated: ${new Date().toLocaleString("en-NG")}`, 14, 18);

  // Active Filters summary text
  const filterDesc = [
    filters?.statusFilter ? `Status: ${filters.statusFilter.toUpperCase()}` : "Status: ALL",
    filters?.categoryFilter ? `Category: ${filters.categoryFilter}` : "Category: ALL",
    filters?.searchTerm ? `Search: "${filters.searchTerm}"` : null,
    `Total: ${items.length} records`,
  ]
    .filter(Boolean)
    .join("  |  ");

  doc.setFontSize(8.5);
  doc.setTextColor(180, 180, 180);
  doc.text(filterDesc, 14, 31);

  // Prepare table headers & data
  const tableHeaders = [
    [
      "Ref ID",
      "Stage Name",
      "Real Name",
      "Category",
      "Song Title",
      "Status",
      "Artist Photo URL",
      "Cover Art URL",
      "Media Link",
      "Submitted At",
    ],
  ];

  const tableData = items.map((item) => [
    item.reference_id,
    item.stage_name,
    item.real_name,
    item.category,
    item.song_title,
    item.status.toUpperCase(),
    item.photo_url || "",
    item.cover_art_url || "",
    item.media_link || "",
    formatDate(item.submitted_at),
  ]);

  // Render PDF Table
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 35,
    margin: { left: 14, right: 14, top: 35, bottom: 15 },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [230, 230, 230],
      fillColor: surfaceDark as [number, number, number],
      lineColor: borderBrown as [number, number, number],
      lineWidth: 0.2,
      font: "helvetica",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: bgDark as [number, number, number],
      textColor: goldPrimary as [number, number, number],
      fontStyle: "bold",
      lineWidth: 0.3,
      lineColor: goldPrimary as [number, number, number],
    },
    alternateRowStyles: {
      fillColor: [20, 14, 9],
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: "bold" }, // Ref ID
      1: { cellWidth: 26 }, // Stage Name
      2: { cellWidth: 24 }, // Real Name
      3: { cellWidth: 32 }, // Category
      4: { cellWidth: 26 }, // Song Title
      5: { cellWidth: 16 }, // Status
      6: { cellWidth: 32 }, // Artist Photo URL
      7: { cellWidth: 32 }, // Cover Art URL
      8: { cellWidth: 32 }, // Media Link
      9: { cellWidth: 24 }, // Submitted At
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `Page ${data.pageNumber} of ${totalPages}  •  Bayelsa Musical Artiste Awards 2026`,
        14,
        203
      );
    },
  });

  const statusPart = filters?.statusFilter ? `_${filters.statusFilter}` : "";
  doc.save(`BMAA_Submissions${statusPart}_${getFileTimestamp()}.pdf`);
}

