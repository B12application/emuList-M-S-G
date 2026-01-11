// src/frontend/utils/avatarUtils.ts

const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';

export const getDefaultAvatar = (gender?: 'male' | 'female'): string => {
    if (gender === 'female') {
        return FEMALE_AVATAR_URL;
    }
    return MALE_AVATAR_URL;
};
