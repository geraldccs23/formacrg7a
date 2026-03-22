// /root/rg7-agent/app/server.js
// RG7 Agent API (Sales + Purchases + Stock Snapshot)
// - Auth via Bearer AGENT_TOKEN
// - /api/agent/ping
// - /api/agent/sales_lines (rg7_hist.sales_lines) idempotent by uniq_key
// - /api/agent/purchase_lines (public.purchase_lines) idempotent by uniq_key
// - /api/agent/stock_snapshot (public.stock_snapshots + public.stock_snapshot_lines)

const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json({ limit: "25mb" }));

const PORT = process.env.PORT || 3000;
const AGENT_TOKEN = process.env.AGENT_TOKEN || "";

// --------------------
// Auth middleware
// --------------------
function requireAuth(req, res, next) {
    const h = req.headers["authorization"] || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!AGENT_TOKEN || token !== AGENT_TOKEN) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    next();
}

// --------------------
// PG Pool
// --------------------
const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: Number(process.env.PGPOOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.PGPOOL_IDLE || 30000),
    connectionTimeoutMillis: Number(process.env.PGPOOL_CONN_TIMEOUT || 10000),
});

// --------------------
// Ping
// --------------------
app.get("/api/agent/ping", async (_req, res) => {
    try {
        const r = await pool.query("select now() as now");
        res.json({ ok: true, now: r.rows[0].now });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
});

// --------------------
// Sales lines
// payload: { source_db, extracted_at, lines: [] }
// writes to rg7_hist.sales_lines
// --------------------
app.post("/api/agent/sales_lines", requireAuth, async (req, res) => {
    const { extracted_at, lines } = req.body || {};
    if (!Array.isArray(lines)) {
        return res.status(400).json({ ok: false, error: "lines must be array" });
    }

    const source_db = (req.body?.source_db || "UNKNOWN_DB").toString().trim();

    const client = await pool.connect();
    try {
        await client.query("begin");

        const sql = `
      insert into rg7_hist.sales_lines
      (uniq_key,
       fuente, fecha_hora, tipo_documento, numero_documento,
       codigo_cliente, nombre_cliente, codigo_vendedor, vendedor, sucursal,
       codigo_producto, line_seq,
       descripcion, barra_referencia, marca_producto, categoria_mapeada, categoria_tipo,
       tasa, precio_bs, precio_usd, cantidad, total_bs, total_usd, raw, extracted_at)
      values
      ($1,
       $2,$3,$4,$5,
       $6,$7,$8,$9,$10,
       $11,$12,
       $13,$14,$15,$16,$17,
       $18,$19,$20,$21,$22,$23,$24::jsonb,$25)
      on conflict (uniq_key) do nothing
      returning id
    `;

        let inserted = 0;

        for (const l of lines) {
            const fuente = (l.fuente || l.source || "UNKNOWN").toString().trim();
            const fecha_hora = l.fecha_hora || l.fec_emis || null;

            const tipo_documento =
                ((l.tipo_documento || "UNKNOWN").toString().trim()) || "UNKNOWN";
            const numero_documento =
                ((l.numero_documento || l.doc_num || "UNKNOWN").toString().trim()) ||
                "UNKNOWN";
            const sucursal =
                ((l.sucursal || l.nombre_sucursal || "UNKNOWN").toString().trim()) ||
                "UNKNOWN";
            const codigo_producto =
                ((l.codigo_producto || l.co_art || "UNKNOWN").toString().trim()) ||
                "UNKNOWN";

            const line_seq = Number.isFinite(Number(l.line_seq))
                ? Number(l.line_seq)
                : null;

            const uniq_key = [
                source_db,
                fuente,
                sucursal,
                tipo_documento,
                numero_documento,
                codigo_producto,
                line_seq ?? "",
                fecha_hora || "",
            ].join("|");

            const r = await client.query(sql, [
                uniq_key,
                fuente,
                fecha_hora,
                tipo_documento,
                numero_documento,

                l.codigo_cliente ?? l.co_cli ?? null,
                l.nombre_cliente ?? null,
                l.codigo_vendedor ?? l.co_ven ?? null,
                l.vendedor ?? l.nombre_vendedor ?? null,
                sucursal,

                codigo_producto,
                line_seq,

                l.descripcion ?? l.des_art ?? null,
                l.barra_referencia ?? l.co_bar ?? l.co_art ?? null,
                l.marca_producto ?? null,
                l.categoria_mapeada ?? null,
                l.categoria_tipo ?? null,

                l.tasa ?? null,
                l.precio_bs ?? l.prec_vta ?? null,
                l.precio_usd ?? null,
                l.cantidad ?? null,
                l.total_bs ?? l.reng_neto ?? null,
                l.total_usd ?? null,

                JSON.stringify(l),
                extracted_at ? new Date(extracted_at) : new Date(),
            ]);

            if (r.rowCount === 1) inserted++;
        }

        await client.query("commit");
        res.json({ ok: true, inserted });
    } catch (e) {
        try {
            await client.query("rollback");
        } catch { }
        res.status(500).json({ ok: false, error: String(e?.message || e) });
    } finally {
        client.release();
    }
});

// --------------------
// Purchase lines
// payload: { source_db, extracted_at, lines: [] }
// writes to public.purchase_lines
// --------------------
app.post("/api/agent/purchase_lines", requireAuth, async (req, res) => {
    const { extracted_at, lines } = req.body || {};
    if (!Array.isArray(lines)) {
        return res.status(400).json({ ok: false, error: "lines must be array" });
    }

    const source_db = (req.body?.source_db || "UNKNOWN_DB").toString().trim();

    const client = await pool.connect();
    try {
        await client.query("begin");

        const sql = `
      insert into public.purchase_lines
      (uniq_key,
       fuente, fecha_hora, tipo_documento, numero_documento, sucursal,
       proveedor_codigo, proveedor_nombre,
       codigo_producto, line_seq,
       descripcion, cantidad,
       costo_bs, costo_usd,
       tasa_original, tasa_ref_dia, tasa_final, tasa_es_valida,
       raw, extracted_at)
      values
      ($1,
       $2,$3,$4,$5,$6,
       $7,$8,
       $9,$10,
       $11,$12,
       $13,$14,
       $15,$16,$17,$18,
       $19::jsonb,$20)
      on conflict (uniq_key) do nothing
      returning id
    `;

        let inserted = 0;

        for (const l of lines) {
            const fuente = (l.fuente || l.source || "UNKNOWN").toString().trim();
            const fecha_hora = l.fecha_hora || l.fecha || null;

            const tipo_documento =
                ((l.tipo_documento || "UNKNOWN").toString().trim()) || "UNKNOWN";
            const numero_documento =
                ((l.numero_documento || "UNKNOWN").toString().trim()) || "UNKNOWN";

            const sucursal = (
                l.sucursal ||
                l.codigo_sucursal ||
                l.co_alma ||
                "UNKNOWN"
            )
                .toString()
                .trim();

            const codigo_producto =
                ((l.codigo_producto || l.co_art || "UNKNOWN").toString().trim()) ||
                "UNKNOWN";

            const line_seq = Number.isFinite(Number(l.line_seq))
                ? Number(l.line_seq)
                : null;

            const uniq_key = [
                source_db,
                fuente,
                sucursal,
                tipo_documento,
                numero_documento,
                codigo_producto,
                line_seq ?? "",
                fecha_hora || "",
            ].join("|");

            const r = await client.query(sql, [
                uniq_key,
                fuente,
                fecha_hora,
                tipo_documento,
                numero_documento,
                sucursal,

                l.proveedor_codigo ?? l.co_prov ?? l.codprov ?? null,
                l.proveedor_nombre ?? l.proveedor ?? null,

                codigo_producto,
                line_seq,

                l.descripcion ?? l.des_art ?? null,
                l.cantidad ?? null,

                l.costo_bs ?? l.costo ?? null,
                l.costo_usd ?? null,

                l.tasa_original ?? null,
                l.tasa_ref_dia ?? null,
                l.tasa_final ?? null,
                l.tasa_es_valida ?? null,

                JSON.stringify(l),
                extracted_at ? new Date(extracted_at) : new Date(),
            ]);

            if (r.rowCount === 1) inserted++;
        }

        await client.query("commit");
        res.json({ ok: true, inserted });
    } catch (e) {
        try {
            await client.query("rollback");
        } catch { }
        res.status(500).json({ ok: false, error: String(e?.message || e) });
    } finally {
        client.release();
    }
});

// --------------------
// Stock snapshot
// payload: { source_db, branch, warehouses:[], captured_at, rows:[{co_art,co_alma,stock,descripcion}] }
// writes to public.stock_snapshots + public.stock_snapshot_lines
// --------------------
app.post("/api/agent/stock_snapshot", requireAuth, async (req, res) => {
    const { branch, warehouses, captured_at, rows } = req.body || {};

    if (!branch || typeof branch !== "string") {
        return res.status(400).json({ ok: false, error: "branch is required" });
    }

    if (!Array.isArray(warehouses)) {
        return res.status(400).json({ ok: false, error: "warehouses must be array" });
    }

    if (!Array.isArray(rows)) {
        return res.status(400).json({ ok: false, error: "rows must be array" });
    }

    const client = await pool.connect();

    try {
        await client.query("begin");

        // HEADER (warehouses es text[])
        const headerSql = `
      insert into public.stock_snapshots
        (branch, captured_at, warehouses, rows_count)
      values
        ($1, $2, $3::text[], $4)
      returning id
    `;

        const capturedAt = captured_at ? new Date(captured_at) : new Date();

        // --- CLEANUP: dejar solo snapshots del día (por sucursal) ---
        await client.query(
            `   
            delete from public.stock_snapshots
            where branch = $1
            and captured_at < date_trunc('day', $2::timestamptz)
            `,
            [branch.trim(), capturedAt]
        );

        const header = await client.query(headerSql, [
            branch.trim(),
            capturedAt,
            warehouses,
            rows.length,
        ]);

        const snapshot_id = header.rows[0].id;

        // LINES (incluye descripcion)
        const lineSql = `
      insert into public.stock_snapshot_lines
        (snapshot_id, codigo_producto, codigo_almacen, stock, descripcion, modelo, ref, precio_usd, precio_bs, tasa_ref)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

        let inserted_lines = 0;

        // Debug: Log keys of first row to see what's actually arriving
        if (rows.length > 0) {
            try {
                const fs = require('fs');
                const path = require('path');
                fs.writeFileSync(path.join(__dirname, 'snapshot_debug.json'), JSON.stringify({
                    keys: Object.keys(rows[0]),
                    sample: rows[0]
                }, null, 2));
            } catch (e) { }
        }

        for (const r of rows) {
            const codigo_producto =
                ((r.co_art || r.codigo_producto || "").toString().trim()) || null;

            const codigo_almacen =
                ((r.co_alma || r.codigo_almacen || "").toString().trim()) || null;

            const descripcionRaw = r.descripcion || r.des_art || null;
            const descripcion =
                descripcionRaw !== null && descripcionRaw !== undefined
                    ? String(descripcionRaw).trim() || null
                    : null;

            const modeloRaw = r.modelo || null;
            const modelo =
                modeloRaw !== null && modeloRaw !== undefined
                    ? String(modeloRaw).trim() || null
                    : null;

            // Use || to prioritize any non-zero value across potential keys
            // Added fallbacks for Profit Plus common fields
            const precio_usd_num = Number(r.precio_usd || r.precioUsd || r.prec_vta1 || r.monto_vta1 || r.monto || 0);
            const precio_usd = Number.isFinite(precio_usd_num) ? precio_usd_num : 0;

            const precio_bs_num = Number(r.precio_bs || r.precioBs || r.montoadi1 || r.prec_vta1_bs || 0);
            const precio_bs = Number.isFinite(precio_bs_num) ? precio_bs_num : 0;

            const tasa_ref_num = Number(r.tasa_ref || r.tasaRef || r.montoadi5 || r.tasa || 0);
            const tasa_ref = Number.isFinite(tasa_ref_num) ? tasa_ref_num : 0;

            const refRaw = r.ref || null;
            const ref =
                refRaw !== null && refRaw !== undefined
                    ? String(refRaw).trim() || null
                    : null;

            const stock = Number(r.stock);

            if (!codigo_producto || !codigo_almacen || !Number.isFinite(stock)) {
                continue;
            }

            const rr = await client.query(lineSql, [
                snapshot_id,
                codigo_producto,
                codigo_almacen,
                stock,
                descripcion,
                modelo,
                ref,
                precio_usd,
                precio_bs,
                tasa_ref,
            ]);

            if (rr.rowCount === 1) inserted_lines++;
        }

        await client.query("commit");

        return res.json({
            ok: true,
            snapshot_id,
            inserted_lines,
            rows_in_payload: rows.length,
        });

    } catch (e) {
        try { await client.query("rollback"); } catch { }
        return res.status(500).json({ ok: false, error: String(e?.message || e) });
    } finally {
        client.release();
    }
});

app.listen(PORT, () => console.log("rg7-agent-api listening on", PORT));
