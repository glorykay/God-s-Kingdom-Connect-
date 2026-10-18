import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/Modal';
import { Workspace, Service, Member, Attendance } from '@/types';
import { Download, Copy, Check, Share2, ClipboardCheck, Clock, FileSpreadsheet } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { getServiceStatus } from '@/lib/serviceTime';
import { todayLocalISO, parseLocalDate, todayLocalStartISOString, tomorrowLocalStartISOString } from '@/lib/dateUtils';
import * as XLSX from 'xlsx-js-style';
import { dedupeAttendance } from '@/lib/attendanceUtils';

interface CheckInQRModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
}

export function CheckInQRModal({ open, onClose, workspace }: CheckInQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [exporting, setExporting] = useState(false);
  const { t } = useLanguage();
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const checkinUrl = `${window.location.origin}?checkin=${workspace.join_code}`;

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from('services').select('*').eq('workspace_id', workspace.id).order('service_date', { ascending: true }),
      supabase.from('members').select('*').eq('workspace_id', workspace.id),
      supabase.from('attendance').select('*').eq('workspace_id', workspace.id).gte('timestamp', todayLocalStartISOString()).lt('timestamp', tomorrowLocalStartISOString()).order('timestamp', { ascending: false }),
    ]).then(([svcRes, memRes, attRes]) => {
      setServices(svcRes.data ?? []);
      setMembers(memRes.data ?? []);
      setTodayAttendance(dedupeAttendance(attRes.data ?? []));
    });
  }, [open, workspace.id]);

  const activeServices = services.filter((s) => getServiceStatus(s) === 'active');

  function copyLink() {
    navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQR() {
    const svg = qrWrapperRef.current?.querySelector('svg');
    if (!svg) return;

    const svgString = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `glory-center-checkin-${workspace.join_code}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      });
    };
    img.src = url;
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('checkinQR.shareTitle', { name: workspace.name }),
          text: t('checkinQR.shareText', { name: workspace.name }),
          url: checkinUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      copyLink();
    }
  }

  function exportTodaySheet() {
    if (todayAttendance.length === 0) return;
    setExporting(true);

    const churchName = workspace.name;
    const reportDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const todayDateStr = todayLocalISO();

    const headerStyle: XLSX.CellObject['s'] = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12, name: 'Calibri' },
      fill: { fgColor: { rgb: 'F59E0B' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'D97706' } },
        bottom: { style: 'thin', color: { rgb: 'D97706' } },
        left: { style: 'thin', color: { rgb: 'D97706' } },
        right: { style: 'thin', color: { rgb: 'D97706' } },
      },
    };
    const titleStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 18, color: { rgb: '1E293B' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
    };
    const subtitleStyle: XLSX.CellObject['s'] = {
      font: { italic: true, sz: 11, color: { rgb: '64748B' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
    };
    const sectionStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 13, color: { rgb: 'F59E0B' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
    };
    const dataStyle: XLSX.CellObject['s'] = {
      font: { sz: 11, name: 'Calibri' },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };
    const altRowStyle: XLSX.CellObject['s'] = {
      font: { sz: 11, name: 'Calibri' },
      fill: { fgColor: { rgb: 'F8FAFC' } },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };
    const greenStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 11, color: { rgb: '059669' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };
    const grayStyle: XLSX.CellObject['s'] = {
      font: { sz: 11, color: { rgb: '94A3B8' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };

    function styleRows(ws: XLSX.WorkSheet, startRow: number, rowCount: number, colCount: number) {
      for (let i = 0; i < rowCount; i++) {
        for (let c = 0; c < colCount; c++) {
          const ref = XLSX.utils.encode_cell({ r: startRow + i, c });
          if (ws[ref]) ws[ref].s = i % 2 === 1 ? { ...altRowStyle } : { ...dataStyle };
        }
      }
    }
    function styleHeaders(ws: XLSX.WorkSheet, row: number, colCount: number) {
      for (let c = 0; c < colCount; c++) {
        const ref = XLSX.utils.encode_cell({ r: row, c });
        if (ws[ref]) ws[ref].s = headerStyle;
      }
    }

    const colCount = 7;
    const workbook = XLSX.utils.book_new();

    // Group today's attendance by service
    const todayServiceIds = [...new Set(todayAttendance.map((a) => a.service_id))];
    const todayServices = services.filter((s) => todayServiceIds.includes(s.id));

    todayServices.forEach((service) => {
      const serviceAtt = todayAttendance.filter((a) => a.service_id === service.id);
      const serviceDate = parseLocalDate(service.service_date).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const ws = XLSX.utils.aoa_to_sheet([
        [churchName],
        [t('checkinQR.todaySheet')],
        [`Generated: ${reportDate}`],
        [],
        ['Service', service.name, 'Date', serviceDate, 'Speaker', service.speaker ?? '—', ''],
        ['Time', `${service.service_time}${service.service_end_time ? ` – ${service.service_end_time}` : ''}`, '', '', '', '', ''],
        [],
        ['Name', 'Email', 'Phone', 'Check-in Time', 'New Comer', 'Testimony', 'Prayer Request'],
        ...serviceAtt.map((a) => {
          const member = members.find((m) => m.id === a.member_id);
          return [
            a.is_new_comer ? (a.newcomer_name ?? 'New Comer') : member ? `${member.first_name} ${member.last_name}` : 'Member',
            member?.email ?? '',
            member?.phone ?? '',
            new Date(a.timestamp).toLocaleString(),
            a.is_new_comer ? 'Yes' : 'No',
            a.testimony ?? '',
            a.prayer_request ?? '',
          ];
        }),
      ]);

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
        { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },
        { s: { r: 4, c: 5 }, e: { r: 4, c: 6 } },
        { s: { r: 5, c: 1 }, e: { r: 5, c: 6 } },
      ];
      ws['A1'].s = titleStyle;
      ws['A2'].s = sectionStyle;
      ws['A3'].s = subtitleStyle;
      ws['!cols'] = [
        { wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 22 },
        { wch: 12 }, { wch: 30 }, { wch: 30 },
      ];
      styleHeaders(ws, 7, colCount);
      styleRows(ws, 8, serviceAtt.length, colCount);
      serviceAtt.forEach((a, idx) => {
        const row = 8 + idx;
        const ref = XLSX.utils.encode_cell({ r: row, c: 4 });
        if (ws[ref]) {
          const isAlt = idx % 2 === 1;
          const base = a.is_new_comer ? { ...greenStyle } : { ...grayStyle };
          if (isAlt) base.fill = { fgColor: { rgb: 'F8FAFC' } };
          ws[ref].s = base;
        }
      });

      const summaryLabelRow = 8 + serviceAtt.length + 1;
      const summaryRows: (string | number)[][] = [
        ['Summary', ''],
        ['Total Check-ins', serviceAtt.length],
        ['New Comers', serviceAtt.filter((a) => a.is_new_comer).length],
        ['Members Present', serviceAtt.filter((a) => !a.is_new_comer).length],
      ];
      XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: summaryLabelRow });
      ws['!merges'].push({ s: { r: summaryLabelRow, c: 0 }, e: { r: summaryLabelRow, c: 1 } });
      const summaryLabelRef = XLSX.utils.encode_cell({ r: summaryLabelRow, c: 0 });
      if (ws[summaryLabelRef]) ws[summaryLabelRef].s = sectionStyle;
      for (let i = 1; i < summaryRows.length; i++) {
        const r = summaryLabelRow + i;
        const aRef = XLSX.utils.encode_cell({ r, c: 0 });
        const bRef = XLSX.utils.encode_cell({ r, c: 1 });
        if (ws[aRef]) ws[aRef].s = { ...dataStyle, font: { bold: true, sz: 11, name: 'Calibri' } };
        if (ws[bRef]) {
          ws[bRef].s = { ...dataStyle, font: { bold: true, sz: 14, color: { rgb: 'F59E0B' }, name: 'Calibri' }, alignment: { horizontal: 'center' } };
        }
      }

      const sheetName = `${service.name} ${service.service_date}`.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Today';
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    });

    // If no service-specific attendance, create a single sheet with all today's check-ins
    if (todayServices.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([
        [churchName],
        [t('checkinQR.todaySheet')],
        [`Generated: ${reportDate}`],
        [],
        ['Name', 'Email', 'Phone', 'Check-in Time', 'New Comer', 'Testimony', 'Prayer Request'],
        ...todayAttendance.map((a) => {
          const member = members.find((m) => m.id === a.member_id);
          return [
            a.is_new_comer ? (a.newcomer_name ?? 'New Comer') : member ? `${member.first_name} ${member.last_name}` : 'Member',
            member?.email ?? '',
            member?.phone ?? '',
            new Date(a.timestamp).toLocaleString(),
            a.is_new_comer ? 'Yes' : 'No',
            a.testimony ?? '',
            a.prayer_request ?? '',
          ];
        }),
      ]);
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
      ];
      ws['A1'].s = titleStyle;
      ws['A2'].s = sectionStyle;
      ws['A3'].s = subtitleStyle;
      ws['!cols'] = [
        { wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 22 },
        { wch: 12 }, { wch: 30 }, { wch: 30 },
      ];
      styleHeaders(ws, 4, colCount);
      styleRows(ws, 5, todayAttendance.length, colCount);
      XLSX.utils.book_append_sheet(workbook, ws, `Today ${todayDateStr}`.slice(0, 31));
    }

    XLSX.writeFile(workbook, `${churchName.toLowerCase().replace(/\s+/g, '-')}-attendance-${todayDateStr}.xlsx`);
    setExporting(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={t('checkinQR.title')} size="sm">
      <div className="flex flex-col items-center space-y-5">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <ClipboardCheck size={18} />
          <p className="text-sm font-medium">{t('checkinQR.displayForMembers')}</p>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          {t('checkinQR.desc')}
        </p>

        {activeServices.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-center uppercase tracking-wide">
              {t('checkinQR.activeNow')} ({activeServices.length})
            </p>
            {activeServices.map((s) => (
              <div key={s.id} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{s.name}</span>
                <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                  <Clock size={11} /> {s.service_time}{s.service_end_time ? `–${s.service_end_time}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeServices.length === 0 && services.length > 0 && (
          <div className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 text-center">
            <p className="text-xs text-slate-400">{t('checkinQR.noActiveService')}</p>
          </div>
        )}

        {/* Export Today's Sheet */}
        {todayAttendance.length > 0 && (
          <button
            onClick={exportTodaySheet}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <FileSpreadsheet size={16} /> {exporting ? t('dashboard.exporting') : t('checkinQR.exportToday')}
            <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">{todayAttendance.length}</span>
          </button>
        )}

        {/* QR Code */}
        <div ref={qrWrapperRef} className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
          <QRCodeSVG
            value={checkinUrl}
            size={220}
            level="M"
            includeMargin={false}
            fgColor="#1e293b"
            bgColor="#ffffff"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full pt-2">
          <button
            onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Download size={16} /> {t('checkinQR.download')}
          </button>
          <button
            onClick={shareLink}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors"
          >
            <Share2 size={16} /> {t('checkinQR.share')}
          </button>
        </div>

        <button
          onClick={copyLink}
          className="text-xs text-slate-400 hover:text-amber-500 flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? t('checkinQR.linkCopied') : t('checkinQR.copyLink')}
        </button>
      </div>
    </Modal>
  );
}
