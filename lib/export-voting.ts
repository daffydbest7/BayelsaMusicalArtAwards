import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface NomineeStandingItem {
  id: string;
  stage_name: string;
  song_title: string;
  photo_url: string;
  votes: number;
}

export interface CategoryStandingItem {
  category: string;
  totalVotes: number;
  nominees: NomineeStandingItem[];
}

/** Helper to generate sanitized timestamp for file names */
function getFileTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Flatten standings into tabular rows */
function prepareExportRows(standings: CategoryStandingItem[]) {
  const rows: Array<{
    Category: string;
    Rank: number;
    "Stage Name": string;
    "Song Title": string;
    Votes: number;
    "Vote Share (%)": string;
  }> = [];

  for (const cat of standings) {
    const catTotal = cat.totalVotes || 1;
    cat.nominees.forEach((nominee, idx) => {
      const share = ((nominee.votes / catTotal) * 100).toFixed(1) + "%";
      rows.push({
        Category: cat.category,
        Rank: idx + 1,
        "Stage Name": nominee.stage_name,
        "Song Title": nominee.song_title,
        Votes: nominee.votes,
        "Vote Share (%)": share,
      });
    });
  }

  return rows;
}

/**
 * Export Voting Standings to CSV file
 */
export function exportVotingStandingsToCSV(
  standings: CategoryStandingItem[],
  totalVotes: number,
  uniqueVoters: number
) {
  const rows = prepareExportRows(standings);
  if (rows.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Add UTF-8 BOM so Excel opens special characters correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  link.setAttribute("download", `BMAA_Voting_Standings_${getFileTimestamp()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Voting Standings to Excel (.xlsx) file
 */
export function exportVotingStandingsToExcel(
  standings: CategoryStandingItem[],
  totalVotes: number,
  uniqueVoters: number
) {
  const rows = prepareExportRows(standings);
  if (rows.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 30 }, // Category
    { wch: 8 },  // Rank
    { wch: 25 }, // Stage Name
    { wch: 25 }, // Song Title
    { wch: 12 }, // Votes
    { wch: 16 }, // Share %
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Voting Standings");

  // Create a summary sheet with top-level KPIs
  const summaryRows = [
    { Metric: "Total Votes Cast", Value: totalVotes },
    { Metric: "Unique Voters", Value: uniqueVoters },
    { Metric: "Categories Count", Value: standings.length },
    { Metric: "Exported At", Value: new Date().toLocaleString("en-NG") },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary KPIs");

  const filename = `BMAA_Voting_Standings_${getFileTimestamp()}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export Voting Standings to styled PDF document
 */
export function exportVotingStandingsToPDF(
  standings: CategoryStandingItem[],
  totalVotes: number,
  uniqueVoters: number
) {
  if (standings.length === 0) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Color Tokens (BMAA Dark & Gold Brand)
  const bgDark = [17, 8, 4]; // #110804
  const goldPrimary = [210, 148, 46]; // #D2942E
  const textWhite = [245, 241, 235]; // #F5F1EB
  const borderBrown = [108, 60, 10]; // #6C3C0A
  const surfaceDark = [26, 18, 12]; // #1A120C

  // Header bar
  doc.setFillColor(bgDark[0], bgDark[1], bgDark[2]);
  doc.rect(0, 0, 210, 22, "F");

  // Gold accent line
  doc.setFillColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.rect(0, 22, 210, 1.2, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.text("BMAA 2026 — LIVE VOTING STANDINGS REPORT", 14, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text(`Generated: ${new Date().toLocaleString("en-NG")}`, 14, 17);

  // Summary Metrics Banner
  doc.setFontSize(8.5);
  doc.setTextColor(180, 180, 180);
  const summaryText = `Total Votes: ${totalVotes.toLocaleString()}  |  Unique Voters: ${uniqueVoters.toLocaleString()}  |  Categories: ${standings.length}`;
  doc.text(summaryText, 14, 28);

  let currentY = 32;

  // Render table for each category
  for (let cIdx = 0; cIdx < standings.length; cIdx++) {
    const cat = standings[cIdx];

    // Check page space remaining
    if (currentY > 250) {
      doc.addPage();
      currentY = 15;
    }

    // Category Section Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
    doc.text(`${cat.category}  (${cat.totalVotes} total votes)`, 14, currentY + 4);

    const tableHeaders = [["Rank", "Stage Name", "Song Title", "Votes", "Share"]];
    const catTotal = cat.totalVotes || 1;

    const tableData = cat.nominees.map((nominee, idx) => [
      String(idx + 1),
      nominee.stage_name,
      nominee.song_title,
      nominee.votes.toLocaleString(),
      ((nominee.votes / catTotal) * 100).toFixed(1) + "%",
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: currentY + 6,
      margin: { left: 14, right: 14, top: 15, bottom: 15 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [230, 230, 230],
        fillColor: surfaceDark as [number, number, number],
        lineColor: borderBrown as [number, number, number],
        lineWidth: 0.15,
        font: "helvetica",
      },
      headStyles: {
        fillColor: bgDark as [number, number, number],
        textColor: goldPrimary as [number, number, number],
        fontStyle: "bold",
        lineWidth: 0.2,
        lineColor: goldPrimary as [number, number, number],
      },
      columnStyles: {
        0: { cellWidth: 15, fontStyle: "bold", halign: "center" }, // Rank
        1: { cellWidth: 55 }, // Stage Name
        2: { cellWidth: 55 }, // Song Title
        3: { cellWidth: 25, halign: "right" }, // Votes
        4: { cellWidth: 32, halign: "right" }, // Share
      },
      didDrawPage: (data) => {
        const totalPages = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        doc.text(
          `Page ${data.pageNumber} of ${totalPages}  •  Bayelsa Musical Artiste Awards 2026`,
          14,
          287
        );
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  doc.save(`BMAA_Voting_Standings_${getFileTimestamp()}.pdf`);
}
