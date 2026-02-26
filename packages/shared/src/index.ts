export const SHARED = "@pos/shared";

export const formatCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18);
}

export const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 10) {
        return v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (v.length > 5) {
        return v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (v.length > 2) {
        return v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else {
        return v.replace(/^(\d*)/, '($1');
    }
}

export const formatCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d)/, '$1-$2')
        .substring(0, 9);
}

export * from './roles';
export * from './products';
export * from './categories';
export * from './units'
export * from './sales';
export * from './customers';
export * from './cash-register';
export * from './stock';
export * from './suppliers';
export * from './purchases';
export * from './purchases';
export * from './coupons';
export * from './branch';
export * from './audit';
