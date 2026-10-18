import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/Modal';
import { Workspace } from '@/types';
import { Download, Copy, Check, QrCode, Share2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
}

export function QRCodeModal({ open, onClose, workspace }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const joinUrl = `${window.location.origin}?join=${workspace.join_code}`;

  function copyCode() {
    navigator.clipboard.writeText(workspace.join_code);
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
        link.download = `glory-center-join-${workspace.join_code}.png`;
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
          title: t('qrModal.shareTitle', { name: workspace.name }),
          text: t('qrModal.shareText', { code: workspace.join_code }),
          url: joinUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('qrModal.title')} size="sm">
      <div className="flex flex-col items-center space-y-5">
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          {t('qrModal.desc', { name: workspace.name })}
        </p>

        {/* QR Code */}
        <div ref={qrWrapperRef} className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
          <QRCodeSVG
            value={joinUrl}
            size={220}
            level="M"
            includeMargin={false}
            fgColor="#1e293b"
            bgColor="#ffffff"
          />
        </div>

        {/* Join Code */}
        <div className="flex items-center gap-3">
          <div className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600">
            <span className="text-2xl font-bold tracking-[0.3em] text-slate-900 dark:text-white">{workspace.join_code}</span>
          </div>
          <button
            onClick={copyCode}
            className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
            title={t('qrModal.copyCode')}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full pt-2">
          <button
            onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Download size={16} /> {t('qrModal.downloadQR')}
          </button>
          <button
            onClick={shareLink}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors"
          >
            <Share2 size={16} /> {t('qrModal.shareLink')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
