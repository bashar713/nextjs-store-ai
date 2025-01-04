export const cardTypes = {
  visa: {
    pattern: /^4/,
    icon: '/cards/visa.svg'
  },
  mastercard: {
    pattern: /^5[1-5]|^2[2-7]/,
    icon: '/cards/mastercard.svg'
  },
  amex: {
    pattern: /^3[47]/,
    icon: '/cards/amex.svg'
  },
  discover: {
    pattern: /^6(?:011|5)/,
    icon: '/cards/discover.svg'
  }
};

export const getCardType = (number: string) => {
  const cleanNumber = number.replace(/\D/g, '');
  for (const [type, { pattern }] of Object.entries(cardTypes)) {
    if (pattern.test(cleanNumber)) {
      return type;
    }
  }
  return 'unknown';
};

export const formatCardNumber = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  const isAmex = /^3[47]/.test(cleanValue);
  const groups = isAmex 
    ? [4, 6, 5] // AMEX format: XXXX XXXXXX XXXXX
    : [4, 4, 4, 4]; // Other cards: XXXX XXXX XXXX XXXX
  
  let result = '';
  let currentGroup = 0;
  let currentPosition = 0;

  for (let i = 0; i < cleanValue.length && currentGroup < groups.length; i++) {
    if (currentPosition === groups[currentGroup]) {
      result += ' ';
      currentGroup++;
      currentPosition = 0;
    }
    result += cleanValue[i];
    currentPosition++;
  }

  return result.trim();
};

export const formatExpiryDate = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length >= 2) {
    const month = parseInt(cleanValue.substring(0, 2));
    if (month > 12) {
      return '12' + (cleanValue.length > 2 ? '/' + cleanValue.substring(2) : '');
    }
    return cleanValue.substring(0, 2) + (cleanValue.length > 2 ? '/' + cleanValue.substring(2) : '');
  }
  return cleanValue;
}; 