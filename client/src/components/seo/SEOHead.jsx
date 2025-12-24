import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEOHead Component
 * Provides SEO meta tags for pages using react-helmet-async
 * 
 * @param {Object} props
 * @param {string} props.title - Page title (will be formatted as "{title} | Renters")
 * @param {string} props.description - Meta description (150-160 chars recommended)
 * @param {string} props.image - Open Graph image URL
 * @param {string} props.url - Canonical URL for the page
 * @param {string} props.type - Open Graph type (default: 'website')
 */
function SEOHead({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website' 
}) {
  const siteName = 'Renters';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Find rooms, flats, houses & halls for rent';
  const defaultImage = '/property_image/placeholder-logo.png';
  
  const metaDescription = description || defaultDescription;
  const metaImage = image || defaultImage;
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      {metaImage && <meta property="og:image" content={metaImage} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {metaImage && <meta name="twitter:image" content={metaImage} />}
    </Helmet>
  );
}

SEOHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string
};

export default SEOHead;
