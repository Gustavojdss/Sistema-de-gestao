import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ItemAlmoxarifado } from '../types/erp';
import { QrCode as QrCodeIcon } from 'lucide-react';

interface EquipmentQrCodeProps {
  item: ItemAlmoxarifado;
  size?: number;
  className?: string;
  showBorder?: boolean;
}

export const EquipmentQrCode: React.FC<EquipmentQrCodeProps> = ({
  item,
  size = 48,
  className = '',
  showBorder = true
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Structured payload containing all vital equipment data
    const payload = JSON.stringify({
      app: 'Brasal ERP Almoxarifado',
      id: item.id,
      patrimonio: item.numero_serie,
      nome: item.nome,
      categoria: item.categoria,
      status: item.status,
      condicao: item.condicao,
      obra_id: item.obra_id,
      local: item.localizacao || 'Almoxarifado Central',
      val: item.valor_aquisicao,
      verificado_em: new Date().toISOString().split('T')[0]
    });

    QRCode.toDataURL(payload, {
      width: size * 2, // 2x for retina display crispness
      margin: 1,
      color: {
        dark: '#1e293b', // slate-800
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        if (isMounted) setDataUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code for equipment', item.id, err);
      });

    return () => {
      isMounted = false;
    };
  }, [item, size]);

  if (!dataUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-slate-100 rounded text-slate-400 ${showBorder ? 'border border-slate-200' : ''} ${className}`}
        style={{ width: size, height: size }}
      >
        <QrCodeIcon className="w-4 h-4 animate-pulse text-slate-400" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code ${item.numero_serie} - ${item.nome}`}
      className={`rounded object-contain ${showBorder ? 'border border-slate-200 shadow-2xs' : ''} ${className}`}
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
    />
  );
};
