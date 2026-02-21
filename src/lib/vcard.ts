
export const imageUrlToBase64 = async (url: string): Promise<string> => {
    if (!url) return "";
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Strip the data:image/xxx;base64, part
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error converting image to base64:", error);
        return "";
    }
};

export const downloadVCard = async (userData: any) => {
    const {
        firstName = "",
        lastName = "",
        title = "",
        company = "",
        email = "",
        email_2 = "-",
        phone = "",
        phone_2 = "-",
        website = "",
        address = "",
        logoUrl = "",
        socialLinks = []
    } = userData;

    let vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${lastName};${firstName};;;`,
        `FN:${firstName} ${lastName}`,
        `ORG:${company}`,
        `TITLE:${title}`,
        `TEL;TYPE=CELL:${phone}`,
        `EMAIL:${email}`,
        `URL:${website}`,
    ];

    if (phone_2 && phone_2 !== '-') {
        vcard.push(`TEL;TYPE=WORK:${phone_2}`);
    }

    if (email_2 && email_2 !== '-') {
        vcard.push(`EMAIL;TYPE=WORK:${email_2}`);
    }

    if (address) {
        vcard.push(`ADR;TYPE=WORK:;;${address};;;;`);
    }

    if (logoUrl) {
        const base64Photo = await imageUrlToBase64(logoUrl);
        if (base64Photo) {
            // Split base64 into chunks of 75 characters as per vCard spec for better compatibility
            // although many modern parsers don't strictly require it.
            vcard.push(`PHOTO;ENCODING=b;TYPE=JPEG:${base64Photo}`);
        }
    }

    // Add social links
    if (socialLinks && Array.isArray(socialLinks)) {
        socialLinks.forEach((link: any) => {
            if (link.url && link.active !== false && !['web_link', 'gallery_image', 'featured_video'].includes(link.platform)) {
                // Using X-SOCIALPROFILE which is supported by iOS and some others
                vcard.push(`X-SOCIALPROFILE;TYPE=${link.platform}:${link.url}`);
            }
        });
    }

    vcard.push('END:VCARD');

    const vcardString = vcard.join('\n');
    const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${firstName}_${lastName}.vcf`.replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};
