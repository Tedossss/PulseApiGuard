import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://falach.pl', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: 'https://falach.pl/PAG', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://falach.pl/colab', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];
}
