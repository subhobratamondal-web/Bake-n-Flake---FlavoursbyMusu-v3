const fs = require('fs');

let content = fs.readFileSync('src/components/ProductReviewsModal.tsx', 'utf8');

const targetFunc = `function getReviewsForProduct(productName: string = '', category: string = ''): ReviewItem[] {
  const pLower = (productName + ' ' + category).toLowerCase();
  // 1. Chocolate Truffle
  if (pLower.includes('truffle')) {
    return [`;

const replacementFunc = `function getReviewsForProduct(productName: string = '', category: string = '', dynamicReviews: any[] = []): ReviewItem[] {
  const pLower = (productName + ' ' + category).toLowerCase();
  
  // Combine real dynamic reviews and fallback static reviews
  let results: ReviewItem[] = [];
  
  if (dynamicReviews && dynamicReviews.length > 0) {
    const matched = dynamicReviews.filter(rev => {
      if (!rev.textEn) return false;
      return rev.textEn.toLowerCase().includes(productName.toLowerCase()) || 
             (category && rev.textEn.toLowerCase().includes(category.toLowerCase()));
    }).map((rev, i) => ({
      id: 'd_' + i,
      userName: rev.nameEn || 'Customer',
      rating: rev.rating || 5,
      date: rev.timeEn || 'Recently',
      comment: rev.textEn || '',
      photoUrl: rev.images && rev.images.length > 0 ? rev.images[0] : undefined,
      verified: true
    }));
    results = [...results, ...matched];
  }
  
  // 1. Chocolate Truffle
  if (pLower.includes('truffle')) {
    results.push(...[`;

content = content.replace(targetFunc, replacementFunc);

const targetCall = `  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);

  useEffect(() => {
    if (product) {
      setReviewsList(getReviewsForProduct(product.nameEn, product.section));
    }
  }, [product]);`;

const replacementCall = `  const { dynamicReviews } = useContext(AppContext);
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);

  useEffect(() => {
    if (product) {
      setReviewsList(getReviewsForProduct(product.nameEn, product.section, dynamicReviews));
    }
  }, [product, dynamicReviews]);`;

content = content.replace(targetCall, replacementCall);
fs.writeFileSync('src/components/ProductReviewsModal.tsx', content);
