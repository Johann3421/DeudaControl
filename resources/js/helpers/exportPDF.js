import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
    primary: [14, 165, 233],
    success: [16, 185, 129],
    warning: [245, 158, 11],
    danger:  [239, 68, 68],
    violet:  [139, 92, 246],
    slate:   [100, 116, 139],
    light:   [241, 245, 249],
    card:    [248, 250, 252],
    dark:    [15, 23, 42],
    text:    [51, 65, 85],
    muted:   [148, 163, 184],
    white:   [255, 255, 255],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(amount, currency = 'PEN') {
    if (amount == null || amount === '') return '-';
    const sym = currency === 'USD' ? '$' : 'S/';
    return `${sym} ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function cap(str) {
    if (!str) return '-';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Draw a donut/pie chart using triangle-fan method
function drawPie(doc, cx, cy, r, segments) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return;

    let startAngle = -Math.PI / 2;
    for (const seg of segments) {
        if (seg.value <= 0) continue;
        const sliceAngle = (seg.value / total) * 2 * Math.PI;
        const steps = Math.max(3, Math.ceil(sliceAngle * 24));
        doc.setFillColor(...seg.color);
        for (let i = 0; i < steps; i++) {
            const a1 = startAngle + (sliceAngle * i) / steps;
            const a2 = startAngle + (sliceAngle * (i + 1)) / steps;
            doc.triangle(
                cx, cy,
                cx + r * Math.cos(a1), cy + r * Math.sin(a1),
                cx + r * Math.cos(a2), cy + r * Math.sin(a2),
                'F'
            );
        }
        startAngle += sliceAngle;
    }
    // White center = donut
    doc.setFillColor(...C.white);
    const inner = r * 0.48;
    const steps2 = 48;
    for (let i = 0; i < steps2; i++) {
        const a1 = (i / steps2) * 2 * Math.PI;
        const a2 = ((i + 1) / steps2) * 2 * Math.PI;
        doc.triangle(cx, cy, cx + inner * Math.cos(a1), cy + inner * Math.sin(a1), cx + inner * Math.cos(a2), cy + inner * Math.sin(a2), 'F');
    }
}

// Draw legend for pie
function drawLegend(doc, x, y, segments, total) {
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const pct = total > 0 ? ((seg.value / total) * 100).toFixed(0) : '0';
        const ly = y + i * 8.5;
        doc.setFillColor(...seg.color);
        doc.roundedRect(x, ly, 5, 4.5, 1, 1, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.text);
        doc.text(`${seg.label}`, x + 7, ly + 3.5);
        doc.setTextColor(...C.muted);
        doc.text(`${seg.value}  (${pct}%)`, x + 7 + doc.getTextWidth(seg.label) + 1, ly + 3.5);
    }
}

// Draw horizontal bar chart
function drawBars(doc, x, y, w, h, bars, maxVal) {
    doc.setFillColor(...C.card);
    doc.rect(x, y, w, h, 'F');
    if (!bars.length || maxVal <= 0) return;

    const labelW = 54;
    const valueW = 28;
    const barAreaW = w - labelW - valueW - 8;
    const barH = Math.min(8, (h - 8) / bars.length - 3);

    bars.forEach((bar, i) => {
        const barY = y + 5 + i * (barH + 3.5);
        const fillW = Math.max(1.5, (Math.abs(bar.value) / maxVal) * barAreaW);

        doc.setFontSize(7);
        doc.setTextColor(...C.text);
        const lbl = bar.label.length > 16 ? bar.label.slice(0, 16) + '…' : bar.label;
        doc.text(lbl, x + 3, barY + barH / 2 + 2.2);

        doc.setFillColor(...(bar.color || C.primary));
        doc.roundedRect(x + labelW, barY, fillW, barH, 1, 1, 'F');

        doc.setFontSize(6.5);
        doc.setTextColor(...C.muted);
        doc.text(bar.valueLabel, x + labelW + barAreaW + 3, barY + barH / 2 + 2.2);
    });
}

// Draw a stat card with accent top bar
function drawStatCard(doc, x, y, w, h, label, value, accentColor) {
    doc.setFillColor(...C.card);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
    doc.setDrawColor(...C.light);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'D');
    doc.setFillColor(...accentColor);
    doc.rect(x, y, w, 2, 'F');

    doc.setFontSize(6.5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...C.muted);
    doc.text(label.toUpperCase(), x + 4, y + 9);

    doc.setFontSize(8.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.dark);
    doc.text(String(value), x + 4, y + 17);
}

// Page header band
function drawHeader(doc, title, subtitle, accentColor) {
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, W, 22, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, 5, 22, 'F');

    doc.setFontSize(15);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.white);
    doc.text(title, 13, 13);

    doc.setFontSize(7.5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...C.muted);
    doc.text(subtitle, 13, 19);
}

// Footer on all pages
function drawFooter(doc, text) {
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const n = doc.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
        doc.setPage(i);
        doc.setFontSize(6.5);
        doc.setTextColor(...C.muted);
        doc.text(`Página ${i} de ${n}  |  ${text}`, W / 2, H - 5, { align: 'center' });
    }
}

// ─── EXPORT DEUDAS ────────────────────────────────────────────────────────────
export function exportDeudasPDF({ deudas, filtros, user }) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const all = Array.isArray(deudas) ? deudas : (deudas.data || []);

    // Header
    const filtroTxt = [filtros?.tipo_deuda || 'Todos los tipos', filtros?.estado || 'Todos los estados'].join(' / ');
    drawHeader(doc, 'REPORTE DE DEUDAS', `Generado: ${now}  |  Usuario: ${user?.name || 'Sistema'}  |  Filtros: ${filtroTxt}`, C.primary);

    let y = 28;

    // ── Resumen stats ──
    const totalMonto      = all.reduce((s, d) => s + Number(d.monto_total || 0), 0);
    const totalPendiente  = all.reduce((s, d) => s + Number(d.monto_pendiente || 0), 0);
    const totalPagado     = totalMonto - totalPendiente;
    const estadoCounts    = { activa: 0, pagada: 0, vencida: 0, cancelada: 0 };
    all.forEach(d => { estadoCounts[d.estado] = (estadoCounts[d.estado] || 0) + 1; });
    const tipoCounts      = { particular: 0, entidad: 0, alquiler: 0 };
    all.forEach(d => { tipoCounts[d.tipo_deuda] = (tipoCounts[d.tipo_deuda] || 0) + 1; });

    const stats = [
        { label: 'Total Deudas',  value: String(all.length),      color: C.primary },
        { label: 'Monto Total',   value: fmt(totalMonto),          color: C.slate   },
        { label: 'Pendiente',     value: fmt(totalPendiente),      color: C.warning },
        { label: 'Cobrado',       value: fmt(totalPagado),         color: C.success },
        { label: 'Activas',       value: String(estadoCounts.activa),  color: C.primary },
        { label: 'Vencidas',      value: String(estadoCounts.vencida), color: C.danger  },
    ];

    const bW = (W - 28 - 5 * 3) / 6;
    stats.forEach((s, i) => drawStatCard(doc, 14 + i * (bW + 3), y, bW, 21, s.label, s.value, s.color));
    y += 27;

    // ── Charts row ──
    const chartH = 58;

    // Panel 1: Donut estado
    const p1x = 14, p1w = 85;
    doc.setFillColor(...C.card);
    doc.roundedRect(p1x, y, p1w, chartH, 3, 3, 'F');
    doc.setDrawColor(...C.light);
    doc.roundedRect(p1x, y, p1w, chartH, 3, 3, 'D');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.text);
    doc.text('DISTRIBUCIÓN POR ESTADO', p1x + 4, y + 8);

    const pieSeg1 = [
        { label: 'Activa',    value: estadoCounts.activa,    color: C.primary },
        { label: 'Pagada',    value: estadoCounts.pagada,    color: C.success },
        { label: 'Vencida',   value: estadoCounts.vencida,   color: C.danger  },
        { label: 'Cancelada', value: estadoCounts.cancelada, color: C.slate   },
    ].filter(s => s.value > 0);
    drawPie(doc, p1x + 23, y + 36, 17, pieSeg1);
    drawLegend(doc, p1x + 44, y + 18, pieSeg1, all.length);

    // Panel 2: Donut tipo deuda
    const p2x = p1x + p1w + 4, p2w = 72;
    doc.setFillColor(...C.card);
    doc.roundedRect(p2x, y, p2w, chartH, 3, 3, 'F');
    doc.roundedRect(p2x, y, p2w, chartH, 3, 3, 'D');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.text);
    doc.text('DISTRIBUCIÓN POR TIPO', p2x + 4, y + 8);

    const pieSeg2 = [
        { label: 'Particular', value: tipoCounts.particular, color: [245, 158, 11] },
        { label: 'Entidad',    value: tipoCounts.entidad,    color: [139, 92, 246] },
        { label: 'Alquiler',   value: tipoCounts.alquiler,   color: [16, 185, 129] },
    ].filter(s => s.value > 0);
    drawPie(doc, p2x + 20, y + 36, 16, pieSeg2);
    drawLegend(doc, p2x + 38, y + 20, pieSeg2, all.length);

    // Panel 3: Horizontal bars - top deudas
    const p3x = p2x + p2w + 4;
    const p3w = W - p3x - 14;
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.text);
    doc.text('TOP 8 DEUDAS POR MONTO', p3x + 4, y + 8);

    const topDeudas = [...all]
        .sort((a, b) => Number(b.monto_total) - Number(a.monto_total))
        .slice(0, 8)
        .map(d => ({
            label: d.descripcion || 'Sin desc.',
            value: Number(d.monto_total),
            valueLabel: fmt(d.monto_total, d.currency_code),
            color: d.estado === 'pagada' ? C.success : d.estado === 'vencida' ? C.danger : C.primary,
        }));
    const maxBar = topDeudas.length > 0 ? topDeudas[0].value : 1;
    drawBars(doc, p3x, y + 10, p3w, chartH - 10, topDeudas, maxBar);

    y += chartH + 6;

    // ── Tabla detalle ──
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.text);
    doc.text('DETALLE DE DEUDAS', 14, y + 1);
    y += 5;

    const rows = all.map(d => {
        const prog = d.monto_total > 0 ? ((d.monto_total - d.monto_pendiente) / d.monto_total * 100).toFixed(0) + '%' : '0%';
        const cliente = d.cliente
            ? `${d.cliente.nombre || ''} ${d.cliente.apellido || ''}`.trim()
            : d.deuda_entidad?.entidad?.razon_social || '-';
        return [
            d.descripcion || '-',
            cliente,
            cap(d.tipo_deuda),
            fmt(d.monto_total, d.currency_code),
            fmt(d.monto_pendiente, d.currency_code),
            prog,
            cap(d.estado),
            d.fecha_vencimiento ? new Date(d.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE') : '-',
            d.user?.name || '-',
        ];
    });

    const estadoColors = {
        activa:    C.primary,
        pagada:    C.success,
        vencida:   C.danger,
        cancelada: C.slate,
    };

    autoTable(doc, {
        startY: y,
        head: [['Descripción', 'Cliente / Entidad', 'Tipo', 'Monto Total', 'Pendiente', 'Progreso', 'Estado', 'Vencimiento', 'Creado por']],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2.5, textColor: C.text, lineColor: C.light, lineWidth: 0.2 },
        headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: C.card },
        columnStyles: {
            0: { cellWidth: 44 },
            1: { cellWidth: 38 },
            2: { cellWidth: 22 },
            3: { cellWidth: 27, halign: 'right' },
            4: { cellWidth: 27, halign: 'right' },
            5: { cellWidth: 16, halign: 'center' },
            6: { cellWidth: 20, halign: 'center' },
            7: { cellWidth: 22, halign: 'center' },
            8: { cellWidth: 'auto' },
        },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 6) {
                const estado = (all[data.row.index]?.estado || '').toLowerCase();
                data.cell.styles.textColor = estadoColors[estado] || C.slate;
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 14, right: 14 },
    });

    drawFooter(doc, `Control de Deudas  |  ${now}`);
    doc.save(`reporte-deudas-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── EXPORT UTILIDADES ────────────────────────────────────────────────────────
export function exportUtilidadesPDF({ ocs, resumen, filtros, user }) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const all = Array.isArray(ocs) ? ocs : (ocs.data || []);

    // Header
    drawHeader(doc, 'REPORTE DE UTILIDADES', `Generado: ${now}  |  Usuario: ${user?.name || 'Sistema'}`, C.violet);

    let y = 28;

    // ── Resumen stats ──
    const margenPct = resumen.total_vendido > 0
        ? ((resumen.total_utilidad / resumen.total_vendido) * 100).toFixed(1) + '%'
        : '0.0%';

    const stats = [
        { label: 'Total Vendido',    value: fmt(resumen.total_vendido),  color: C.slate   },
        { label: 'Total Gastado',    value: fmt(resumen.total_gastado),  color: C.warning },
        { label: 'Utilidad Neta',    value: fmt(resumen.total_utilidad), color: Number(resumen.total_utilidad) >= 0 ? C.success : C.danger },
        { label: 'Margen %',         value: margenPct,                   color: Number(resumen.total_utilidad) >= 0 ? C.success : C.danger },
        { label: 'Deuda por Cobrar', value: fmt(resumen.total_deuda),    color: C.violet  },
        { label: 'Total OCs',        value: String(resumen.total_ocs),   color: C.primary },
    ];

    const bW = (W - 28 - 5 * 3) / 6;
    stats.forEach((s, i) => drawStatCard(doc, 14 + i * (bW + 3), y, bW, 21, s.label, s.value, s.color));
    y += 27;

    // ── Charts row ──
    const chartH = 58;
    const estadoCounts = { pendiente: 0, entregado: 0, facturado: 0, pagado: 0 };
    all.forEach(oc => { estadoCounts[oc.estado] = (estadoCounts[oc.estado] || 0) + 1; });

    // Panel 1: Donut estado
    const p1x = 14, p1w = 82;
    doc.setFillColor(...C.card);
    doc.roundedRect(p1x, y, p1w, chartH, 3, 3, 'F');
    doc.setDrawColor(...C.light);
    doc.roundedRect(p1x, y, p1w, chartH, 3, 3, 'D');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.text);
    doc.text('DISTRIBUCIÓN POR ESTADO', p1x + 4, y + 8);

    const pieSeg = [
        { label: 'Pendiente',  value: estadoCounts.pendiente,  color: C.warning },
        { label: 'Entregado',  value: estadoCounts.entregado,  color: C.primary },
        { label: 'Facturado',  value: estadoCounts.facturado,  color: C.violet  },
        { label: 'Pagado',     value: estadoCounts.pagado,     color: C.success },
    ].filter(s => s.value > 0);
    drawPie(doc, p1x + 22, y + 37, 17, pieSeg);
    drawLegend(doc, p1x + 43, y + 20, pieSeg, all.length);

    // Panel 2: Top OCs por utilidad
    const p2x = p1x + p1w + 4;
    const p2w = Math.floor((W - p2x - 14 - 4) / 2);
    doc.setFillColor(...C.card);
    doc.roundedRect(p2x, y, p2w, chartH, 3, 3, 'F');
    doc.setDrawColor(...C.light);
    doc.roundedRect(p2x, y, p2w, chartH, 3, 3, 'D');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.text);
    doc.text('TOP 8 OC POR UTILIDAD', p2x + 4, y + 8);

    const topUtil = [...all]
        .sort((a, b) => Number(b.utilidad) - Number(a.utilidad))
        .slice(0, 8)
        .map(oc => ({
            label: oc.numero_oc,
            value: Math.abs(Number(oc.utilidad)),
            valueLabel: fmt(oc.utilidad, oc.currency_code),
            color: Number(oc.utilidad) >= 0 ? C.success : C.danger,
        }));
    const maxUtil = topUtil.length > 0 ? Math.max(...topUtil.map(x => x.value), 1) : 1;
    drawBars(doc, p2x, y + 10, p2w, chartH - 10, topUtil, maxUtil);

    // Panel 3: Venta vs Gasto (doble barra)
    const p3x = p2x + p2w + 4;
    const p3w = W - p3x - 14;
    doc.setFillColor(...C.card);
    doc.roundedRect(p3x, y, p3w, chartH, 3, 3, 'F');
    doc.setDrawColor(...C.light);
    doc.roundedRect(p3x, y, p3w, chartH, 3, 3, 'D');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.text);
    doc.text('VENTA vs GASTO — TOP 8 OC', p3x + 4, y + 8);

    const top8 = [...all]
        .sort((a, b) => Number(b.total_oc) - Number(a.total_oc))
        .slice(0, 8);
    const maxV = top8.length > 0 ? Math.max(...top8.map(x => Number(x.total_oc)), 1) : 1;
    const labelW = 22, barAreaW = p3w - labelW - 6;
    const rowH = Math.min(7.5, (chartH - 20) / (top8.length || 1));

    top8.forEach((oc, i) => {
        const rowY = y + 13 + i * (rowH * 2 + 2.5);
        const vW = Math.max(1, (Number(oc.total_oc) / maxV) * barAreaW);
        const gW = Math.max(1, (Number(oc.total_gastos) / maxV) * barAreaW);

        doc.setFontSize(6.5);
        doc.setTextColor(...C.text);
        doc.text(oc.numero_oc, p3x + 3, rowY + rowH / 2 + 2);

        doc.setFillColor(...C.primary);
        doc.roundedRect(p3x + labelW, rowY, vW, rowH - 0.5, 0.8, 0.8, 'F');
        doc.setFillColor(...C.warning);
        doc.roundedRect(p3x + labelW, rowY + rowH, gW, rowH - 0.5, 0.8, 0.8, 'F');
    });

    // Leyenda mini
    const ly = y + chartH - 7;
    doc.setFillColor(...C.primary); doc.rect(p3x + 4, ly, 5, 3.5, 'F');
    doc.setFontSize(6.5); doc.setTextColor(...C.text);
    doc.text('Venta', p3x + 11, ly + 3);
    doc.setFillColor(...C.warning); doc.rect(p3x + 28, ly, 5, 3.5, 'F');
    doc.text('Gasto', p3x + 35, ly + 3);

    y += chartH + 6;

    // ── Tabla detalle ──
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...C.text);
    doc.text('DETALLE DE ÓRDENES DE COMPRA', 14, y + 1);
    y += 5;

    const estadoColorsOC = {
        pendiente: C.warning,
        entregado: C.primary,
        facturado: C.violet,
        pagado:    C.success,
    };

    const rows = all.map(oc => {
        const cliente = oc.cliente ? `${oc.cliente.nombre || ''} ${oc.cliente.apellido || ''}`.trim() : '-';
        return [
            oc.numero_oc || '-',
            cliente,
            oc.empresa_factura || '-',
            oc.entidad_recibe || '-',
            oc.fecha_oc ? new Date(oc.fecha_oc).toLocaleDateString('es-PE') : '-',
            fmt(oc.total_oc, oc.currency_code),
            fmt(oc.total_gastos, oc.currency_code),
            fmt(oc.utilidad, oc.currency_code),
            `${Number(oc.porcentaje_utilidad || 0).toFixed(1)}%`,
            fmt(oc.deuda_pendiente, oc.currency_code),
            cap(oc.estado),
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [['N° OC', 'Cliente', 'Empresa Factura', 'Entidad Recibe', 'Fecha OC', 'Total OC', 'Gastos', 'Utilidad', '% Util.', 'Por Cobrar', 'Estado']],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2.5, textColor: C.text, lineColor: C.light, lineWidth: 0.2 },
        headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: C.card },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 28 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 19, halign: 'center' },
            5: { cellWidth: 24, halign: 'right' },
            6: { cellWidth: 24, halign: 'right' },
            7: { cellWidth: 24, halign: 'right' },
            8: { cellWidth: 16, halign: 'center' },
            9: { cellWidth: 22, halign: 'right' },
            10: { cellWidth: 'auto', halign: 'center' },
        },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 10) {
                const estado = (all[data.row.index]?.estado || '').toLowerCase();
                data.cell.styles.textColor = estadoColorsOC[estado] || C.slate;
                data.cell.styles.fontStyle = 'bold';
            }
            if (data.section === 'body' && data.column.index === 7) {
                const util = Number(all[data.row.index]?.utilidad || 0);
                data.cell.styles.textColor = util >= 0 ? C.success : C.danger;
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 14, right: 14 },
    });

    drawFooter(doc, `Control de Deudas — Utilidades  |  ${now}`);
    doc.save(`reporte-utilidades-${new Date().toISOString().split('T')[0]}.pdf`);
}
