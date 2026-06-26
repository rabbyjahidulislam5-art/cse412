import { getFullUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns a self-contained, printable HTML receipt for a given receipt id.
// Opens in a new tab on the client and triggers window.print().
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getFullUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const r = user.receipts.find((x) => x.id === params.id);
  if (!r) return new Response("Receipt not found", { status: 404 });

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Receipt ${r.reference}</title>
<style>
  *{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  body{margin:0;background:#f1f5f9;color:#0f172a;padding:24px}
  .sheet{max-width:720px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 10px 30px rgba(15,23,42,.08)}
  .row{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
  .brand{display:flex;align-items:center;gap:12px}
  .logo{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#3366ff,#1735e1);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
  .muted{color:#64748b;font-size:13px}
  h2{margin:0;font-size:20px}
  table{width:100%;border-collapse:collapse;margin:20px 0}
  td,th{padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}
  th{color:#64748b;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.04em}
  .total{font-size:22px;font-weight:800;color:#0f172a}
  .badge{display:inline-block;padding:4px 12px;border-radius:999px;background:#dcfce7;color:#16a34a;font-weight:700;font-size:12px}
  .foot{margin-top:24px;padding-top:16px;border-top:1px dashed #cbd5e1;color:#94a3b8;font-size:12px;text-align:center}
  .actions{margin-top:24px;text-align:center}
  button{background:#3366ff;color:#fff;border:0;padding:10px 20px;border-radius:10px;font-weight:700;cursor:pointer}
  @media print{body{background:#fff;padding:0}.actions{display:none}.sheet{box-shadow:none;border-radius:0}}
</style></head>
<body>
<div class="sheet">
  <div class="row">
    <div class="brand">
      <div class="logo">EWU</div>
      <div>
        <h2>East West University</h2>
        <div class="muted">Smart Campus • Official Payment Receipt</div>
      </div>
    </div>
    <div class="badge">PAID</div>
  </div>
  <table>
    <tr><th>Receipt No.</th><td>${r.reference}</td></tr>
    <tr><th>Student</th><td>${user.account.name} (${user.account.studentId})</td></tr>
    <tr><th>Purpose</th><td>${r.purpose}</td></tr>
    <tr><th>Method</th><td>${r.method}</td></tr>
    <tr><th>Date</th><td>${new Date(r.date).toLocaleString("en-GB")}</td></tr>
    <tr><th>Amount</th><td><span class="total">৳${r.amount.toLocaleString("en-IN")}</span></td></tr>
  </table>
  <div class="muted">This is a computer-generated receipt and does not require a physical signature.</div>
  <div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="foot">© ${new Date().getFullYear()} East West University · Aftabnagar, Dhaka</div>
</div>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
