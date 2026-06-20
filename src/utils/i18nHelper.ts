import i18n from '@/i18n';

export function getLocalizedField<T extends Record<string, any>>(
  obj: T | undefined,
  field: string
): string {
  if (!obj) return '';
  const lang = i18n.language || 'az';
  const key = `${field}${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof T;
  return (obj[key] as string) || obj[`${field}Az` as keyof T] || obj[field as keyof T] || '';
}

export function getLocalizedName(obj: { nameAz?: string; nameEn?: string; nameRu?: string; nameTr?: string; name?: string } | undefined): string {
  if (!obj) return '';
  const lang = i18n.language || 'az';
  const map: Record<string, string | undefined> = {
    az: obj.nameAz,
    en: obj.nameEn,
    ru: obj.nameRu,
    tr: obj.nameTr,
  };
  return map[lang] || obj.nameAz || obj.name || '';
}

export function getLocalizedDescription(obj: { descriptionAz?: string; descriptionEn?: string; descriptionRu?: string; descriptionTr?: string; description?: string } | undefined): string {
  if (!obj) return '';
  const lang = i18n.language || 'az';
  const map: Record<string, string | undefined> = {
    az: obj.descriptionAz,
    en: obj.descriptionEn,
    ru: obj.descriptionRu,
    tr: obj.descriptionTr,
  };
  return map[lang] || obj.descriptionAz || obj.description || '';
}
