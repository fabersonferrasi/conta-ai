// Mapa centralizado de Bandeiras e Bancos Brasileiros  
// Usado em TODA a aplicação para garantir consistência visual

export type BankBrand = {
  id: string;
  label: string;
  color: string;
  abbr: string;
  textColor?: string;
};

export const BANK_BRANDS: BankBrand[] = [
  { id: 'nubank',     label: 'Nubank',          color: '#820AD1', abbr: 'NU' },
  { id: 'itau',       label: 'Itaú',            color: '#EC7000', abbr: 'ITÚ' },
  { id: 'bradesco',   label: 'Bradesco',        color: '#CC092F', abbr: 'BRA' },
  { id: 'bb',         label: 'Banco do Brasil',  color: '#FFEF00', abbr: 'BB', textColor: '#003882' },
  { id: 'caixa',      label: 'Caixa',           color: '#005CA9', abbr: 'CX' },
  { id: 'santander',  label: 'Santander',       color: '#EC0000', abbr: 'SAN' },
  { id: 'inter',      label: 'Inter',           color: '#FF7A00', abbr: 'INT' },
  { id: 'c6',         label: 'C6 Bank',         color: '#1A1A1A', abbr: 'C6' },
  { id: 'btg',        label: 'BTG Pactual',     color: '#001E60', abbr: 'BTG' },
  { id: 'pan',        label: 'Banco Pan',       color: '#0033A0', abbr: 'PAN' },
  { id: 'next',       label: 'Next',            color: '#00E676', abbr: 'NXT', textColor: '#111' },
  { id: 'xp',         label: 'XP',              color: '#000',    abbr: 'XP' },
  { id: 'sicoob',     label: 'Sicoob',          color: '#003641', abbr: 'SCB' },
  { id: 'sicredi',    label: 'Sicredi',         color: '#007A33', abbr: 'SCR' },
  { id: 'picpay',     label: 'PicPay',          color: '#21C25E', abbr: 'PIC', textColor: '#111' },
  { id: 'neon',       label: 'Neon',            color: '#00D2FF', abbr: 'NEO', textColor: '#111' },
  { id: 'visa',       label: 'Visa',            color: '#1A1F71', abbr: 'VISA' },
  { id: 'master',     label: 'Mastercard',      color: '#EB001B', abbr: 'MC' },
  { id: 'elo',        label: 'Elo',             color: '#000',    abbr: 'ELO' },
  { id: 'amex',       label: 'Amex',            color: '#006FCF', abbr: 'AMEX' },
  { id: 'generic',    label: 'Outro',           color: '#6b7280', abbr: '💳' },
];

export function getBrandById(iconId: string | null | undefined): BankBrand {
  return BANK_BRANDS.find(b => b.id === iconId) || BANK_BRANDS[BANK_BRANDS.length - 1];
}

// Componente de badge reutilizável (inline)
export function brandBadgeStyle(brand: BankBrand, size: number = 32) {
  return {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: brand.color,
    color: brand.textColor || '#fff',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: `${size * 0.35}px`,
    fontWeight: 800 as const,
    letterSpacing: '0.5px',
    flexShrink: 0 as const,
  };
}
