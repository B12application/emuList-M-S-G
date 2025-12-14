// src/frontend/utils/avatarUtils.ts

export const getDefaultAvatar = (gender?: 'male' | 'female'): string => {
    if (gender === 'female') {
        return 'https://www.pngall.com/wp-content/uploads/5/Profile-PNG-File.png'; // Female avatar
    }
    return 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png'; // Male avatar (default)
};
