export interface Product {
    id: string;
    name: string;
    image: string;
    price: string;
    originalPrice?: string;
    tag?: string;
    rating?: number;
    categories: string[];
    description?: string;
    features?: string[];
    images?: string[];
}

export const products: Product[] = [
    {
        id: "black-nfc-metal-card",
        name: "Black NFC Metal Card",
        image: "https://static.wixstatic.com/media/319071_550e60e3039044daa3944ef319cfbf83~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_550e60e3039044daa3944ef319cfbf83~mv2.jpg",
        price: "₹1,999.50",
        originalPrice: "₹3,999.00",
        tag: "Premium",
        categories: ["NFC Cards"],
        description: "Elevate Your Networking with Premium Metal NFC Cards. Experience the perfect blend of sophistication and technology with our Metal NFC Cards. Crafted from high-quality metal, these cards offer a sleek and durable design that stands out in any professional setting. With a simple tap, share your digital content seamlessly—whether it's your social media profiles, contact details, or portfolio. Our Metal NFC Cards not only facilitate instant connection but also leave a lasting impression of elegance and innovation.",
        features: [
            "Premium Build: Made from high-grade metal for durability and a luxurious feel.",
            "Effortless Sharing: Tap to share your information instantly with any compatible device.",
            "Customizable: Tailor the design to reflect your personal brand or business identity.",
            "Impressive Design: Stand out with a card that's as functional as it is stylish.",
            "Material: Metal"
        ],
        images: [
            "https://static.wixstatic.com/media/319071_550e60e3039044daa3944ef319cfbf83~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_550e60e3039044daa3944ef319cfbf83~mv2.jpg"
        ]
    },
    {
        id: "silver-nfc-metal-card",
        name: "Silver NFC Metal Card",
        image: "https://static.wixstatic.com/media/319071_942cc775f7144ea387dcd8cc1620ff13~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_942cc775f7144ea387dcd8cc1620ff13~mv2.jpg",
        price: "₹1,999.50",
        originalPrice: "₹3,999.00",
        tag: "Premium",
        categories: ["NFC Cards"],
        description: "Elevate Your Networking with Premium Metal NFC Cards. Experience the perfect blend of sophistication and technology with our Metal NFC Cards. Crafted from high-grade metal, these cards offer a sleek and durable design that stands out in any professional setting. With a simple tap, share your digital content seamlessly—whether it's your social media profiles, contact details, or portfolio. Our Metal NFC Cards not only facilitate instant connection but also leave a lasting impression of elegance and innovation.",
        features: [
            "Premium Build: Made from high-grade metal for durability and a luxurious feel.",
            "Effortless Sharing: Tap to share your information instantly with any compatible device.",
            "Customizable: Tailor the design to reflect your personal brand or business identity.",
            "Impressive Design: Stand out with a card that's as functional as it is stylish.",
            "Material: Metal"
        ],
        images: [
            "https://static.wixstatic.com/media/319071_942cc775f7144ea387dcd8cc1620ff13~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_942cc775f7144ea387dcd8cc1620ff13~mv2.jpg"
        ]
    },
    {
        id: "smart-business-card-pvc",
        name: "Smart Business Card (PVC)",
        image: "https://static.wixstatic.com/media/319071_300ec076bf1144d4b02ddd8309c1d9bf~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_300ec076bf1144d4b02ddd8309c1d9bf~mv2.jpg",
        price: "₹1,249.50",
        originalPrice: "₹2,499.00",
        categories: ["NFC Cards"],
        description: "Introduce a modern touch to your business interactions with our Smart NFC Business Card. Designed for seamless integration into your business environment, these cards provide an interactive and engaging way to share information with customers. Perfect for business owners, our NFC Business Card allows enhancing their experience and your brand's reach.",
        features: [
            "Interactive Engagement: Allow customers to access information with a simple tap.",
            "Versatile Use: Ideal for a variety of settings, including retail, hospitality, and events.",
            "Customizable Design: Tailor the card to match your brand's aesthetics and messaging.",
            "Enhance Customer Experience: Provide instant access to digital content, improving customer satisfaction and engagement.",
            "Material: PVC"
        ],
        images: [
            "https://static.wixstatic.com/media/319071_300ec076bf1144d4b02ddd8309c1d9bf~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_300ec076bf1144d4b02ddd8309c1d9bf~mv2.jpg"
        ]
    },
    {
        id: "smart-standee",
        name: "Smart Standee",
        image: "https://static.wixstatic.com/media/319071_3188af9bdbe64399a5817b91d7e5d4ff~mv2.jpg/v1/fill/w_350,h_350,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_3188af9bdbe64399a5817b91d7e5d4ff~mv2.jpg",
        price: "₹1,499.50",
        originalPrice: "₹2,999.00",
        tag: "Acrylic",
        categories: ["Smart Standees"],
        description: "Introduce a modern touch to your business interactions with our Smart NFC Standees. Designed for seamless integration into your business environment, these standees provide an interactive and engaging way to share information with customers. Perfect for retail stores, restaurants, events, and more, our NFC standees allow customers to tap their devices to access menus, promotional content, social media pages, and more.",
        features: [
            "Interactive Engagement: Allow customers to access information with a simple tap.",
            "Versatile Use: Ideal for a variety of settings, including retail, hospitality, and events.",
            "Customizable Design: Tailor the standees to match your brand's aesthetics and messaging.",
            "Enhance Customer Experience: Provide instant access to digital content, improving customer satisfaction and engagement.",
            "Material: High-quality Acrylic"
        ],
        images: [
            "https://static.wixstatic.com/media/319071_3188af9bdbe64399a5817b91d7e5d4ff~mv2.jpg/v1/fill/w_350,h_350,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_3188af9bdbe64399a5817b91d7e5d4ff~mv2.jpg"
        ]
    },
    {
        id: "review-standee",
        name: "Review Standee",
        image: "https://static.wixstatic.com/media/319071_e10e4bd7ac7d4e33a9b0ee1ad8e5401f~mv2.jpg/v1/fill/w_700,h_700,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_e10e4bd7ac7d4e33a9b0ee1ad8e5401f~mv2.jpg",
        price: "₹999.50",
        originalPrice: "₹1,999.00",
        tag: "Best Seller",
        categories: ["Smart Standees"],
        description: "Boost your online presence with our Smart Review Standees. Make it effortless for customers to leave reviews on your preferred platforms with just a single tap. Ideal for restaurants, retail shops, salons, and any service-based business looking to build social proof and trust.",
        features: [
            "Instant Reviews: One tap takes customers directly to your review page.",
            "High Visibility: Modern design that catches the eye and encourages interaction.",
            "Durable Material: Made from premium acrylic for a long-lasting professional look.",
            "Plug & Play: Pre-linked to your Google, Trustpilot, or Yelp page.",
            "Material: High-quality Acrylic"
        ],
        images: [
            "https://static.wixstatic.com/media/319071_e10e4bd7ac7d4e33a9b0ee1ad8e5401f~mv2.jpg/v1/fill/w_700,h_700,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_e10e4bd7ac7d4e33a9b0ee1ad8e5401f~mv2.jpg"
        ]
    },
    {
        id: "linkedin-card",
        name: "LinkedIn NFC Card",
        image: "https://static.wixstatic.com/media/319071_299aef10424643cab88a2e80607531ec~mv2.jpg",
        price: "₹749.50",
        originalPrice: "₹1,499.00",
        rating: 4.9,
        categories: ["Social Cards"],
        description: "Amplify your online presence. These cards are specifically designed to share your LinkedIn profile with ease.",
        features: [
            "Professional Networking: Instant LinkedIn connection.",
            "Sleek Design: Professional look matching the platform."
        ],
        images: [
            "https://static.wixstatic.com/media/319071_299aef10424643cab88a2e80607531ec~mv2.jpg",
            "https://static.wixstatic.com/media/319071_e878d2f749bd457c9be13ed628f659e9~mv2.jpg"
        ]
    },
    {
        id: "instagram-card",
        name: "Instagram Card",
        image: "https://static.wixstatic.com/media/319071_20f2d098d85d4b1fbbc247078901f393~mv2.jpg",
        price: "₹749.50",
        originalPrice: "₹1,499.00",
        categories: ["Social Cards"],
        description: "Direct others to your Instagram profile with just a tap. Grow your audience and boost engagement effortlessly.",
        features: [
            "Grow Audience: Instant follow with a tap.",
            "Engagement Boost: Quick access to your content."
        ],
        images: [
            "https://static.wixstatic.com/media/319071_20f2d098d85d4b1fbbc247078901f393~mv2.jpg"
        ]
    },
    {
        id: "whatsapp-card",
        name: "WhatsApp Card",
        image: "https://static.wixstatic.com/media/319071_790ffa76d3424dfe9c0b7babcd1babb4~mv2.jpg",
        price: "₹749.50",
        originalPrice: "₹1,499.00",
        categories: ["Social Cards"],
        description: "Connect instantly on WhatsApp with a simple tap. Ideal for business inquiries and quick networking.",
        features: [
            "Instant Chat: Start a WhatsApp conversation immediately.",
            "Tap & Chat: No need to save numbers first."
        ],
        images: [
            "https://static.wixstatic.com/media/319071_790ffa76d3424dfe9c0b7babcd1babb4~mv2.jpg"
        ]
    },
    {
        id: "youtube-card",
        name: "YouTube Card",
        image: "https://static.wixstatic.com/media/319071_d6d261a2a0c74c81bff7ee7f6b389477~mv2.jpg",
        price: "₹749.50",
        originalPrice: "₹1,499.00",
        categories: ["Social Cards"],
        description: "Share your YouTube channel link instantly. Tap to subscribe or watch videos.",
        features: [
            "Gain Subscribers: Easy access to channel.",
            "Creator Friendly: Perfect for YouTubers."
        ],
        images: [
            "https://static.wixstatic.com/media/319071_d6d261a2a0c74c81bff7ee7f6b389477~mv2.jpg"
        ]
    },
    {
        id: "facebook-card",
        name: "Facebook Card",
        image: "https://static.wixstatic.com/media/319071_ee0d986f49694fe69b42672b515389fa~mv2.jpg",
        price: "₹749.50",
        originalPrice: "₹1,499.00",
        categories: ["Social Cards"],
        description: "Direct others to your Facebook profile or page with just a tap.",
        features: [
            "Page Growth: Get more likes and follows.",
            "Networking: Perfect for personal or business pages."
        ],
        images: [
            "https://static.wixstatic.com/media/319071_ee0d986f49694fe69b42672b515389fa~mv2.jpg"
        ]
    },
    {
        id: "google-review-card",
        name: "Google Review Card",
        image: "https://static.wixstatic.com/media/319071_c30739b6d70f49569c815b81b4cea1af~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_c30739b6d70f49569c815b81b4cea1af~mv2.jpg",
        price: "₹749.50",
        originalPrice: "₹1,499.00",
        categories: ["Review Cards"],
        description: "Enhance Your Reputation with Review NFC Cards. Make it easy for your customers to leave positive feedback with our Review NFC Cards. Designed for businesses seeking to boost their online reputation, these cards provide a hassle-free way for clients to access your review pages on platforms like Google Reviews. By tapping the card, customers can quickly leave reviews, helping you build credibility and attract more business.",
        features: [
            "Google Reviews: Simplify the process for customers to leave Google reviews.",
            "Boost Credibility: Encourage more reviews and improve your online reputation.",
            "Convenient and Efficient: Ensure that leaving a review is as easy as a tap.",
            "Material: PVC"
        ],
        images: [
            "https://static.wixstatic.com/media/319071_c30739b6d70f49569c815b81b4cea1af~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_c30739b6d70f49569c815b81b4cea1af~mv2.jpg"
        ]
    },
    {
        id: "trust-pilot-review-card",
        name: "Trust Pilot Review Card",
        image: "https://static.wixstatic.com/media/319071_b9a2a81131764008b80fbbede521ff72~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_b9a2a81131764008b80fbbede521ff72~mv2.jpg",
        price: "₹749.50",
        originalPrice: "₹1,499.00",
        categories: ["Review Cards"],
        description: "Enhance Your Online Trust with Review NFC Cards. Make it effortless for your customers to leave reviews on Trustpilot with a single tap. These cards are perfect for building transparent credibility and showing off your 5-star service.",
        features: [
            "Trustpilot Reviews: Direct access to your Trustpilot business profile.",
            "Instant Feedback: Encourage customers to share their experience instantly.",
            "Durable & Professional: High-quality PVC card that lasts.",
            "Material: PVC"
        ],
        images: [
            "https://static.wixstatic.com/media/319071_b9a2a81131764008b80fbbede521ff72~mv2.jpg/v1/fill/w_263,h_263,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/319071_b9a2a81131764008b80fbbede521ff72~mv2.jpg"
        ]
    }
];


