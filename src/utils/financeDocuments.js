import { jsPDF } from "jspdf";
import logoImage from "../assets/images/heybe-logo.png";
import { FinanceAPI } from "../helpers/backend_helper";
import { toast } from "react-toastify";

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

const BRAND = {
  primary: [30, 49, 83],
  secondary: [68, 84, 106],
  accent: [198, 138, 24],
  muted: [100, 116, 139],
  light: [245, 247, 250],
  line: [222, 226, 230],
};

const getUtilityUnit = (item) => {
  const label = String(item?.description || item?.type || "").toLowerCase();
  if (label.includes("water")) return "m3";
  return "kWh";
};

const getUsageDescription = (item) => {
  const previousValue = Number(item?.previousValue);
  const currentValue = Number(item?.currentValue);
  const hasReadingPair = Number.isFinite(previousValue) && Number.isFinite(currentValue);
  const consumption = Number(item?.consumption || 0);
  const unit = getUtilityUnit(item);

  if (hasReadingPair) {
    return `Last ${currentValue} - Previous ${previousValue} = Used ${consumption} ${unit}`;
  }

  if (consumption > 0) {
    return `Last ${currentValue} - Previous ${previousValue} = Used ${consumption} ${unit}`;
  }

  return "";
};

const splitDescriptionLines = (doc, text, maxWidth) => {
  const safeText = String(text || "");
  const lines = doc.splitTextToSize(safeText, maxWidth);
  return Array.isArray(lines) ? lines.filter(Boolean) : [safeText];
};

const enrichUtilityRows = async ({ invoice, utilityRows }) => {
  const missingReadings = utilityRows.filter(
    (item) =>
      item?.readingId &&
      (!Number.isFinite(Number(item?.previousValue)) || !Number.isFinite(Number(item?.currentValue))),
  );

  if (!missingReadings.length) {
    return utilityRows;
  }

  try {
    const res = await FinanceAPI.listReadings({
      page: 1,
      limit: 100,
      leaseId: invoice?.leaseId,
      month: Number(invoice?.period?.month),
      year: Number(invoice?.period?.year),
    });

    if (!res?.success) {
      return utilityRows;
    }

    const readingMap = new Map(
      (res.data?.data || []).map((reading) => [String(reading._id), reading]),
    );

    return utilityRows.map((item) => {
      const reading = readingMap.get(String(item?.readingId));
      if (!reading) return item;

      return {
        ...item,
        previousValue:
          item?.previousValue ??
          reading?.readings?.previous?.value,
        currentValue:
          item?.currentValue ??
          reading?.readings?.current?.value,
      };
    });
  } catch (_error) {
    return utilityRows;
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

export const downloadInvoicePdf = async ({ invoice, lease, buildingLabel, organization }) => {
  const doc = new jsPDF("p", "mm", "a4");
  const logo = (organization?.logo ? await loadImageAsDataUrl(organization.logo) : null) || (await loadImageAsDataUrl(logoImage));

  const tenantName =
    `${lease?.tenantId?.personalInfo?.firstName || ""} ${lease?.tenantId?.personalInfo?.lastName || ""}`.trim() ||
    "Tenant";
  const unitLabel = lease?.unitId?.unitNumber || invoice?.unitId?.unitNumber || "Unit";
  const rentAmount = Number(invoice?.items?.rent?.amount || 0);
  const utilityRows = await enrichUtilityRows({
    invoice,
    utilityRows: invoice?.items?.utilities || [],
  });
  const extraRows = invoice?.items?.additionalCharges || [];
  const organizationName = organization?.name || "Organization";
  const issueDate = formatDate(invoice?.createdAt || new Date());
  const dueDateLabel = formatDate(invoice?.period?.dueDate);
  const currency = (value) => formatCurrency(value);
  let y = 18;

  if (logo) {
    doc.addImage(logo, "PNG", 14, y - 1, 28, 28);
  }

  doc.setTextColor(...BRAND.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(organizationName, 48, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.secondary);
  doc.text(`Invoice #: ${invoice?.invoiceNumber || "-"}`, 48, y + 16);
  doc.text(`Due Date: ${dueDateLabel}`, 48, y + 22);

  doc.setFillColor(...BRAND.light);
  doc.setDrawColor(...BRAND.line);
  doc.roundedRect(78, 44, 54, 12, 6, 6, "FD");
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("INVOICES", 105, 52, { align: "center" });

  y = 69;
  doc.setFillColor(...BRAND.primary);
  doc.rect(16, y, 178, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(`INVOICE: ${invoice?.invoiceNumber || "-"}`, 20, y + 7);
  doc.text(`DATE ISSUED: ${issueDate}`, 190, y + 7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${tenantName}`, 20, y + 13);

  y = 89;
  doc.setFillColor(238, 238, 238);
  doc.rect(14, y, 182, 9, "F");
  doc.setTextColor(...BRAND.secondary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Description", 16, y + 6);
  doc.text("QTY", 116, y + 6, { align: "center" });
  doc.text("Price", 132, y + 6, { align: "center" });
  doc.text("Discount", 152, y + 6, { align: "center" });
  doc.text("VAT", 166, y + 6, { align: "center" });
  doc.text("Total", 184, y + 6, { align: "right" });

  y += 13;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);

  const rows = [
    {
      description: `Rent amount for invoice date ${issueDate}.`,
      qty: "1",
      price: currency(rentAmount),
      discount: currency(0),
      vat: currency(0),
      total: currency(rentAmount),
    },
    ...utilityRows.map((item) => {
      const amount = Number(item.amount || item.total || 0);
      const tax = Number(item.tax || 0);
      const usageDescription = getUsageDescription(item);
      return {
        description: usageDescription
          ? `${item.description || item.type || "Utility"} (${usageDescription})`
          : item.description || item.type || "Utility",
        qty: String(item.consumption || 1),
        price: currency(item.rate || amount),
        discount: currency(0),
        vat: currency(tax),
        total: currency(item.total || amount + tax),
      };
    }),
    ...extraRows.map((item) => {
      const amount = Number(item.amount || item.total || 0);
      const tax = Number(item.tax || 0);
      return {
        description: item.description || item.type || "Additional Charge",
        qty: "1",
        price: currency(amount),
        discount: currency(0),
        vat: currency(tax),
        total: currency(item.total || amount + tax),
      };
    }),
  ];

  rows.forEach((row, index) => {
    const rowTop = y - 5;
    const descriptionLines = splitDescriptionLines(doc, row.description, 104);
    const lineHeight = 5;
    const rowHeight = Math.max(11, 6 + descriptionLines.length * lineHeight);

    if (index % 2 === 0) {
      doc.setFillColor(251, 251, 251);
      doc.rect(14, rowTop, 182, rowHeight, "F");
    }
    descriptionLines.forEach((line, lineIndex) => {
      doc.text(line, 16, y + lineIndex * lineHeight);
    });
    doc.text(row.qty, 116, y, { align: "center" });
    doc.text(row.price, 132, y, { align: "center" });
    doc.text(row.discount, 152, y, { align: "center" });
    doc.text(row.vat, 166, y, { align: "center" });
    doc.text(row.total, 184, y, { align: "right" });
    doc.setDrawColor(...BRAND.line);
    doc.line(14, y + rowHeight - 3, 196, y + rowHeight - 3);
    y += rowHeight;
  });

  const previousBalance = Number(invoice?.previousBalance || 0);
  const finalTotal = Number(invoice?.summary?.totalAmount || 0) + previousBalance;

  y += 10;
  doc.setFillColor(...BRAND.light);
  doc.rect(14, y, 182, 45, "F");
  doc.setTextColor(...BRAND.secondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("SUBTOTAL :", 110, y + 7, { align: "right" });
  doc.text(currency(invoice?.summary?.subtotal || 0), 150, y + 7, { align: "right" });
  doc.text("DISCOUNT :", 110, y + 14, { align: "right" });
  doc.text(currency(0), 150, y + 14, { align: "right" });
  doc.text("VAT :", 110, y + 21, { align: "right" });
  doc.text(currency(invoice?.summary?.taxTotal || 0), 150, y + 21, { align: "right" });
  doc.text("TOTAL :", 110, y + 28, { align: "right" });
  doc.text(currency(invoice?.summary?.totalAmount || 0), 150, y + 28, { align: "right" });
  doc.text("PREVIOUS BALANCE :", 110, y + 35, { align: "right" });
  doc.text(currency(previousBalance), 150, y + 35, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("FINAL TOTAL :", 110, y + 42, { align: "right" });
  doc.text(currency(finalTotal), 150, y + 42, { align: "right" });

  y += 63;
  doc.setTextColor(...BRAND.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("WE ARE HONORED TO HAVE YOU AS ONE OF OUR DEAR CUSTOMERS.", 105, y, { align: "center" });

  y += 24;
  doc.setFont("helvetica", "normal");
  doc.text("SIGNATURE", 105, y, { align: "center" });
  doc.setDrawColor(...BRAND.secondary);
  doc.line(65, y + 10, 145, y + 10);

  y += 30;
  doc.setFont("helvetica", "bold");
  doc.text("THANKS FOR YOUR COLLABORATION.", 105, y, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Generated on ${formatDate(new Date())}`, 105, 287, { align: "center" });

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

  // Build a footer totals row if there are numeric columns
  let footerHtml = "";
  if (tableRows && tableRows.length > 0) {
    const sampleRow = tableRows[0];
    const columnKeys = Object.keys(sampleRow);
    const hasNumeric = columnKeys.some(key => {
      const val = sampleRow[key];
      return typeof val === "number" || (!isNaN(val) && !isNaN(parseFloat(val)) && typeof val !== "object" && typeof val !== "boolean");
    });

    if (hasNumeric) {
      footerHtml = `
        <tfoot>
          <tr style="background: #f8f9fa; font-weight: bold; border-top: 2px solid #64748b;">
            ${columnKeys.map((key, colIdx) => {
              const val = sampleRow[key];
              const isNumeric = typeof val === "number" || (!isNaN(val) && !isNaN(parseFloat(val)) && typeof val !== "object" && typeof val !== "boolean");
              if (colIdx === 0) {
                return `<td style="border: 1px solid #cbd5e1; padding: 8px;">Total:</td>`;
              }
              if (isNumeric) {
                const sum = tableRows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
                return `<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(sum)}</td>`;
              }
              return `<td style="border: 1px solid #cbd5e1; padding: 8px;"></td>`;
            }).join("")}
          </tr>
        </tfoot>
      `;
    }
  }

  const filteredSummary = (summaryRows || []).filter(
    (row) => !row.label.includes("%") && !row.label.toLowerCase().includes("rate")
  );

  let summaryTableHtml = "";
  if (filteredSummary.length > 0) {
    summaryTableHtml = `
      <div style="max-width: 500px; margin-bottom: 24px;">
        <h3 style="font-size: 14px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Report Summary</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin-top: 0;">
          <tbody>
            ${filteredSummary.map(row => `
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b; font-size: 12px;">${escapeHtml(row.label)}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; font-size: 12px; color: #0f172a;">${escapeHtml(row.value)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  const html = `
    <html>
      <head>
        <title>${escapeHtml(title || "Report")}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid #cbd5e1; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title || "Report")}</h1>
        ${summaryTableHtml}
        <table>
          <thead>
            <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${(tableRows || [])
        .map(
          (row) =>
            `<tr>${headers.map((header) => {
              const val = row[header];
              const isNumeric = typeof val === "number" || (!isNaN(val) && !isNaN(parseFloat(val)) && typeof val !== "object" && typeof val !== "boolean");
              return `<td style="${isNumeric ? 'text-align: right; font-weight: bold;' : ''}">${escapeHtml(isNumeric && typeof val === 'number' ? formatCurrency(val) : (val ?? ""))}</td>`;
            }).join("")}</tr>`,
        )
        .join("")}
          </tbody>
          ${footerHtml}
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

export const downloadReceiptPdf = async ({ payment, lease, tenant, organization }) => {
  const hasDeposit = payment.allocation?.some((row) => row.itemType === 'deposit');
  if (hasDeposit && organization?.settings?.depositReceiptToggle === false) {
    toast.error("Deposit receipts are disabled by organization settings.");
    return false;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const logo = (organization?.logo ? await loadImageAsDataUrl(organization.logo) : null) || (await loadImageAsDataUrl(logoImage));

  const tenantName =
    `${tenant?.personalInfo?.firstName || ""} ${tenant?.personalInfo?.lastName || ""}`.trim() ||
    "Tenant";
  const unitLabel = lease?.unitId?.unitNumber || payment?.unitId?.unitNumber || "Unit";
  const buildingName = lease?.buildingId?.name || payment?.buildingId?.name || "Building";
  const organizationName = organization?.name || "Organization";
  
  const paymentDateLabel = formatDate(payment?.paymentDate || new Date());
  const receiptNumber = payment?.receipt?.receiptNumber || "-";
  const paymentMethod = payment?.method?.toUpperCase() || "-";

  let referenceNumber = "-";
  if (payment?.method === "evc") {
    referenceNumber = payment?.methodDetails?.evc?.referenceNumber || "-";
  } else if (payment?.method === "merchant") {
    referenceNumber = payment?.methodDetails?.merchant?.referenceNumber || "-";
  } else if (payment?.method === "bank") {
    referenceNumber = payment?.methodDetails?.bank?.transactionId || "-";
  }

  let y = 18;

  if (logo) {
    doc.addImage(logo, "PNG", 14, y - 1, 28, 28);
  }

  doc.setTextColor(...BRAND.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(organizationName, 48, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.secondary);
  doc.text(`Receipt #: ${receiptNumber}`, 48, y + 16);
  doc.text(`Date Paid: ${paymentDateLabel}`, 48, y + 22);

  doc.setFillColor(...BRAND.light);
  doc.setDrawColor(...BRAND.line);
  doc.roundedRect(78, 44, 54, 12, 6, 6, "FD");
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("PAYMENT RECEIPT", 105, 52, { align: "center" });

  y = 69;
  doc.setFillColor(...BRAND.primary);
  doc.rect(16, y, 178, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(`RECEIPT NO: ${receiptNumber}`, 20, y + 7);
  doc.text(`DATE GENERATED: ${formatDate(new Date())}`, 190, y + 7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Paid By: ${tenantName} | Unit: ${unitLabel} (${buildingName})`, 20, y + 13);

  y = 89;
  doc.setFillColor(238, 238, 238);
  doc.rect(14, y, 182, 9, "F");
  doc.setTextColor(...BRAND.secondary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Item Type", 16, y + 6);
  doc.text("Payment Method", 80, y + 6);
  doc.text("Reference Number", 130, y + 6);
  doc.text("Amount Paid", 184, y + 6, { align: "right" });

  y += 13;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);

  const allocations = payment.allocation || [];
  allocations.forEach((alloc, index) => {
    const rowTop = y - 5;
    const rowHeight = 12;

    if (index % 2 === 0) {
      doc.setFillColor(251, 251, 251);
      doc.rect(14, rowTop, 182, rowHeight, "F");
    }

    const typeLabel = alloc.itemType === "deposit" ? "Security Deposit" : alloc.itemType === "rent" ? "Rent" : alloc.itemType === "beginning_balance" ? "Beginning Balance" : alloc.itemType?.toUpperCase() || "Payment";
    
    doc.text(typeLabel, 16, y + 2);
    doc.text(paymentMethod, 80, y + 2);
    doc.text(referenceNumber, 130, y + 2);
    doc.text(formatCurrency(alloc.amount), 184, y + 2, { align: "right" });

    doc.setDrawColor(...BRAND.line);
    doc.line(14, y + rowHeight - 3, 196, y + rowHeight - 3);
    y += rowHeight;
  });

  y += 10;
  doc.setFillColor(...BRAND.light);
  doc.rect(14, y, 182, 20, "F");
  doc.setTextColor(...BRAND.secondary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL PAID :", 110, y + 11, { align: "right" });
  doc.text(formatCurrency(payment.amount), 184, y + 11, { align: "right" });

  y += 35;
  doc.setTextColor(...BRAND.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("WE ARE HONORED TO HAVE YOU AS ONE OF OUR DEAR CUSTOMERS.", 105, y, { align: "center" });

  y += 24;
  doc.setFont("helvetica", "normal");
  doc.text("SIGNATURE / STAMP", 105, y, { align: "center" });
  doc.setDrawColor(...BRAND.secondary);
  doc.line(65, y + 10, 145, y + 10);

  y += 30;
  doc.setFont("helvetica", "bold");
  doc.text("THANKS FOR YOUR COLLABORATION.", 105, y, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Generated on ${formatDate(new Date())}`, 105, 287, { align: "center" });

  doc.save(`Receipt-${receiptNumber}.pdf`);
  return true;
};
