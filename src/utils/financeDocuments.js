import { jsPDF } from "jspdf";
import logoImage from "../assets/images/heybe-logo.png";

const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString()}`;
const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "-";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const loadImageAsDataUrl = async (src) => {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image:", error);
    return null;
  }
};

const addGradientHeader = (doc, y, title) => {
  // Gradient effect using multiple rectangles
  doc.setFillColor(16, 61, 104);
  doc.rect(0, y, 210, 45, "F");
  doc.setFillColor(26, 86, 139);
  doc.rect(0, y + 35, 210, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y + 28);

  return y + 45;
};

const addFooter = (doc, pageNumber, totalPages) => {
  const pageHeight = doc.internal.pageSize.height;

  // Decorative line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for choosing Heybe Property Management", 105, pageHeight - 18, { align: "center" });
  doc.text(`Page ${pageNumber} of ${totalPages}`, 190, pageHeight - 12, { align: "right" });
  doc.text(formatDate(new Date()), 20, pageHeight - 12);
};

export const downloadInvoicePdf = async ({ invoice, lease, buildingLabel }) => {
  const doc = new jsPDF("p", "mm", "a4");
  const logo = await loadImageAsDataUrl(logoImage);

  const tenantName =
    `${lease?.tenantId?.personalInfo?.firstName || ""} ${lease?.tenantId?.personalInfo?.lastName || ""}`.trim() ||
    "Tenant";
  const unitLabel = lease?.unitId?.unitNumber || invoice?.unitId?.unitNumber || "Unit";
  const rentAmount = Number(invoice?.items?.rent?.amount || 0);
  const utilityRows = invoice?.items?.utilities || [];
  const extraRows = invoice?.items?.additionalCharges || [];
  let y = 18;

  if (logo) {
    doc.addImage(logo, "PNG", 16, y - 2, 18, 18);
  }
  doc.setTextColor(16, 61, 104);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Invoice", 40, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Heybe Property Management", 40, y + 12);

  doc.setDrawColor(226, 232, 240);
  doc.line(16, 38, 194, 38);

  y = 48;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Reference", 16, y);
  doc.text("Invoice Date", 100, y);
  doc.text("Status", 156, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(invoice?.invoiceNumber || "-", 16, y + 6);
  doc.text(formatDate(invoice?.createdAt), 100, y + 6);
  doc.text((invoice?.status || "pending").toUpperCase(), 156, y + 6);

  y = 68;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bill To", 16, y);
  doc.text("Property", 100, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(tenantName, 16, y + 7);
  doc.text(lease?.tenantId?.contact?.primaryPhone || "-", 16, y + 13);
  doc.text(`Unit ${unitLabel}`, 100, y + 7);
  doc.text(buildingLabel || "-", 100, y + 13);
  doc.text(`Lease: ${lease?.leaseNumber || "-"}`, 100, y + 19);

  y = 98;
  doc.setFont("helvetica", "bold");
  doc.text("Billing Period", 16, y);
  doc.text("Due Date", 100, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${invoice?.period?.year}-${String(invoice?.period?.month || "").padStart(2, "0")}`, 16, y + 6);
  doc.text(formatDate(invoice?.period?.dueDate), 100, y + 6);

  y = 108;
  doc.setFillColor(16, 61, 104);
  doc.rect(16, y, 178, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Description", 20, y + 6.5);
  doc.text("Qty", 122, y + 6.5, { align: "right" });
  doc.text("Rate", 152, y + 6.5, { align: "right" });
  doc.text("Total", 190, y + 6.5, { align: "right" });

  y += 14;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");

  const rows = [
    { description: "Monthly Rent", qty: "1", rate: formatCurrency(rentAmount), amount: formatCurrency(rentAmount) },
    ...utilityRows.map((item) => ({
      description: item.description || item.type || "Utility",
      qty: String(item.consumption || 0),
      rate: formatCurrency(item.rate || 0),
      amount: formatCurrency(item.total || item.amount || 0),
    })),
    ...extraRows.map((item) => ({
      description: item.description || item.type || "Additional Charge",
      qty: "-",
      rate: "-",
      amount: formatCurrency(item.total || item.amount || 0),
    })),
  ];

  rows.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(16, y - 4, 178, 8, "F");
    }
    doc.text(String(row.description).slice(0, 60), 20, y);
    doc.text(row.qty, 122, y, { align: "right" });
    doc.text(row.rate, 152, y, { align: "right" });
    doc.text(row.amount, 190, y, { align: "right" });
    y += 8;
  });

  y += 4;
  doc.line(120, y, 194, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", 140, y);
  doc.text(formatCurrency(invoice?.summary?.subtotal || 0), 190, y, { align: "right" });
  y += 7;
  if ((invoice?.summary?.taxTotal || 0) > 0) {
    doc.text("Tax", 140, y);
    doc.text(formatCurrency(invoice?.summary?.taxTotal || 0), 190, y, { align: "right" });
    y += 7;
  }
  if ((invoice?.paidAmount || 0) > 0) {
    doc.text("Paid", 140, y);
    doc.text(formatCurrency(invoice?.paidAmount || 0), 190, y, { align: "right" });
    y += 7;
  }
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 61, 104);
  doc.text("Total", 140, y);
  doc.text(formatCurrency(invoice?.summary?.totalAmount || 0), 190, y, { align: "right" });
  y += 7;
  if ((invoice?.balance || 0) > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text("Balance Due", 140, y);
    doc.text(formatCurrency(invoice?.balance || 0), 190, y, { align: "right" });
  }

  y += 15;
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setDrawColor(226, 232, 240);
  doc.line(16, y, 194, y);
  y += 8;

  doc.setTextColor(16, 61, 104);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Payment Instructions", 16, y);
  y += 6;
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Please make payments via the tenant portal or at the building management office.", 16, y);
  doc.text("Late payments may incur additional charges as per your lease agreement.", 16, y + 4);

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("This is a computer generated invoice and does not require a physical signature.", 105, 280, { align: "center" });
  doc.text(`Generated on ${formatDate(new Date())}`, 105, 284, { align: "center" });
  
  doc.save(`${invoice?.invoiceNumber || "invoice"}.pdf`);
};



export const exportFinanceReportExcel = ({ summary, details, fileName }) => {
  const invoiceRows = (details?.invoices || [])
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.invoiceNumber)}</td>
        <td>${escapeHtml(row.tenant?.fullName || "-")}</td>
        <td>${escapeHtml(row.building?.name || "-")}</td>
        <td>${escapeHtml(row.status)}</td>
        <td>${escapeHtml(formatCurrency(row.summary?.totalAmount || 0))}</td>
        <td>${escapeHtml(formatCurrency(row.balance || 0))}</td>
      </tr>`,
    )
    .join("");

  const paymentRows = (details?.payments || [])
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.paymentNumber)}</td>
        <td>${escapeHtml(row.invoiceId?.invoiceNumber || "-")}</td>
        <td>${escapeHtml(row.tenantId?.fullName || "-")}</td>
        <td>${escapeHtml(row.lifecycle?.status || "-")}</td>
        <td>${escapeHtml(formatCurrency(row.amount || 0))}</td>
        <td>${escapeHtml(formatDate(row.paymentDate))}</td>
      </tr>`,
    )
    .join("");

  const expenseRows = (details?.expenses || [])
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.expenseNumber)}</td>
        <td>${escapeHtml(row.category)}</td>
        <td>${escapeHtml(row.payee?.name || "-")}</td>
        <td>${escapeHtml(row.approval?.status || "pending")}</td>
        <td>${escapeHtml(formatCurrency(row.amount || 0))}</td>
        <td>${escapeHtml(formatDate(row.expenseDate))}</td>
      </tr>`,
    )
    .join("");

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <h2>Finance Report</h2>
        <table border="1">
          <tr><th>Total Invoiced</th><th>Total Collected</th><th>Total Expenses</th><th>Outstanding</th><th>Net Cashflow</th></tr>
          <tr>
            <td>${escapeHtml(formatCurrency(summary?.summary?.totalInvoiced || 0))}</td>
            <td>${escapeHtml(formatCurrency(summary?.summary?.totalCollected || 0))}</td>
            <td>${escapeHtml(formatCurrency(summary?.summary?.totalExpenses || 0))}</td>
            <td>${escapeHtml(formatCurrency(summary?.summary?.outstandingBalance || 0))}</td>
            <td>${escapeHtml(formatCurrency(summary?.summary?.netCashflow || 0))}</td>
          </tr>
        </table>
        <h3>Invoices</h3>
        <table border="1">
          <tr><th>Invoice</th><th>Tenant</th><th>Building</th><th>Status</th><th>Total</th><th>Balance</th></tr>
          ${invoiceRows}
        </table>
        <h3>Payments</h3>
        <table border="1">
          <tr><th>Payment</th><th>Invoice</th><th>Tenant</th><th>Status</th><th>Amount</th><th>Date</th></tr>
          ${paymentRows}
        </table>
        <h3>Expenses</h3>
        <table border="1">
          <tr><th>Expense</th><th>Category</th><th>Payee</th><th>Approval</th><th>Amount</th><th>Date</th></tr>
          ${expenseRows}
        </table>
      </body>
    </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName || "finance-report"}.xls`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadFinanceReportPdf = async ({ summary, details, reportTitle, periodLabel }) => {
  const doc = new jsPDF("p", "mm", "a4");
  const logo = await loadImageAsDataUrl(logoImage);

  doc.addImage(logo, "PNG", 16, 10, 24, 24);
  doc.setFillColor(16, 61, 104);
  doc.roundedRect(46, 10, 148, 24, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(reportTitle || "Finance Report", 52, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(periodLabel || "-", 52, 27);
  doc.setTextColor(30, 41, 59);

  let y = 46;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 16, y);
  y += 8;
  y = addPdfRow(doc, "Total Invoiced", formatCurrency(summary?.summary?.totalInvoiced || 0), y);
  y = addPdfRow(doc, "Total Collected", formatCurrency(summary?.summary?.totalCollected || 0), y);
  y = addPdfRow(doc, "Total Expenses", formatCurrency(summary?.summary?.totalExpenses || 0), y);
  y = addPdfRow(doc, "Outstanding Balance", formatCurrency(summary?.summary?.outstandingBalance || 0), y);
  y = addPdfRow(doc, "Net Cashflow", formatCurrency(summary?.summary?.netCashflow || 0), y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Top Detail Rows", 16, y);
  y += 8;
  [...(details?.invoices || []).slice(0, 4), ...(details?.payments || []).slice(0, 3), ...(details?.expenses || []).slice(0, 3)].forEach(
    (row) => {
      y = ensurePageSpace(doc, y, 8);
      doc.setFont("helvetica", "normal");
      if (row.invoiceNumber) {
        doc.text(`Invoice ${row.invoiceNumber} | ${row.tenant?.fullName || "-"} | ${formatCurrency(row.summary?.totalAmount || 0)}`, 16, y);
      } else if (row.paymentNumber) {
        doc.text(`Payment ${row.paymentNumber} | ${row.tenantId?.fullName || "-"} | ${formatCurrency(row.amount || 0)}`, 16, y);
      } else {
        doc.text(`Expense ${row.expenseNumber} | ${row.payee?.name || "-"} | ${formatCurrency(row.amount || 0)}`, 16, y);
      }
      y += 6;
    },
  );

  doc.save(`${reportTitle || "finance-report"}.pdf`);
};

export const printFinanceReport = ({ title, summary, details, periodLabel }) => {
  const html = `
    <html>
      <head>
        <title>${escapeHtml(title || "Finance Report")}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1, h2 { margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
          .cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 20px 0; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
          .muted { color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title || "Finance Report")}</h1>
        <div class="muted">${escapeHtml(periodLabel || "-")}</div>
        <div class="cards">
          <div class="card"><div class="muted">Invoiced</div><strong>${escapeHtml(formatCurrency(summary?.summary?.totalInvoiced || 0))}</strong></div>
          <div class="card"><div class="muted">Collected</div><strong>${escapeHtml(formatCurrency(summary?.summary?.totalCollected || 0))}</strong></div>
          <div class="card"><div class="muted">Expenses</div><strong>${escapeHtml(formatCurrency(summary?.summary?.totalExpenses || 0))}</strong></div>
          <div class="card"><div class="muted">Outstanding</div><strong>${escapeHtml(formatCurrency(summary?.summary?.outstandingBalance || 0))}</strong></div>
          <div class="card"><div class="muted">Net</div><strong>${escapeHtml(formatCurrency(summary?.summary?.netCashflow || 0))}</strong></div>
        </div>
        <h2>Invoices</h2>
        <table>
          <tr><th>Invoice</th><th>Tenant</th><th>Status</th><th>Total</th><th>Balance</th></tr>
          ${(details?.invoices || [])
      .map(
        (row) => `<tr><td>${escapeHtml(row.invoiceNumber)}</td><td>${escapeHtml(row.tenant?.fullName || "-")}</td><td>${escapeHtml(row.status)}</td><td>${escapeHtml(formatCurrency(row.summary?.totalAmount || 0))}</td><td>${escapeHtml(formatCurrency(row.balance || 0))}</td></tr>`,
      )
      .join("")}
        </table>
        <h2>Payments</h2>
        <table>
          <tr><th>Payment</th><th>Invoice</th><th>Tenant</th><th>Status</th><th>Amount</th></tr>
          ${(details?.payments || [])
      .map(
        (row) => `<tr><td>${escapeHtml(row.paymentNumber)}</td><td>${escapeHtml(row.invoiceId?.invoiceNumber || "-")}</td><td>${escapeHtml(row.tenantId?.fullName || "-")}</td><td>${escapeHtml(row.lifecycle?.status || "-")}</td><td>${escapeHtml(formatCurrency(row.amount || 0))}</td></tr>`,
      )
      .join("")}
        </table>
        <h2>Expenses</h2>
        <table>
          <tr><th>Expense</th><th>Category</th><th>Payee</th><th>Status</th><th>Amount</th></tr>
          ${(details?.expenses || [])
      .map(
        (row) => `<tr><td>${escapeHtml(row.expenseNumber)}</td><td>${escapeHtml(row.category)}</td><td>${escapeHtml(row.payee?.name || "-")}</td><td>${escapeHtml(row.approval?.status || "pending")}</td><td>${escapeHtml(formatCurrency(row.amount || 0))}</td></tr>`,
      )
      .join("")}
        </table>
      </body>
    </html>`;

  const printWindow = window.open("", "_blank", "width=1200,height=900");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const exportGenericRowsExcel = ({ fileName, rows }) => {
  const headers = Object.keys(rows?.[0] || {});
  const htmlRows = (rows || [])
    .map(
      (row) =>
        `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`,
    )
    .join("");

  const html = `
    <html>
      <body>
        <table border="1">
          <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          ${htmlRows}
        </table>
      </body>
    </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName || "report"}.xls`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadGenericReportPdf = async ({ title, summaryRows, detailRows }) => {
  const doc = new jsPDF("p", "mm", "a4");
  const logo = await loadImageAsDataUrl(logoImage);
  doc.addImage(logo, "PNG", 16, 10, 24, 24);
  doc.setFillColor(16, 61, 104);
  doc.roundedRect(46, 10, 148, 24, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title || "Report", 52, 20);
  doc.setTextColor(30, 41, 59);

  let y = 44;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 16, y);
  y += 8;
  (summaryRows || []).forEach((row) => {
    y = addPdfRow(doc, row.label, row.value, y);
  });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Details", 16, y);
  y += 8;
  (detailRows || []).slice(0, 18).forEach((row) => {
    y = ensurePageSpace(doc, y, 8);
    doc.setFont("helvetica", "normal");
    doc.text(String(row).slice(0, 180), 16, y);
    y += 6;
  });

  doc.save(`${title || "report"}.pdf`);
};

export const printGenericReport = ({ title, summaryRows, tableRows }) => {
  const headers = Object.keys(tableRows?.[0] || {});
  const html = `
    <html>
      <head>
        <title>${escapeHtml(title || "Report")}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
          .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title || "Report")}</h1>
        <div class="cards">
          ${(summaryRows || [])
      .map((row) => `<div class="card"><div>${escapeHtml(row.label)}</div><strong>${escapeHtml(row.value)}</strong></div>`)
      .join("")}
        </div>
        <table>
          <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          ${(tableRows || [])
      .map(
        (row) =>
          `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`,
      )
      .join("")}
        </table>
      </body>
    </html>`;

  const win = window.open("", "_blank", "width=1200,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};
