import { Image as UIImage } from '@/components/ui/image';

const LOGO_URL =
  'https://media.base44.com/images/public/6a71c75320f377c7cfcdac9d/89513ed79_7270e4_08bc5c439e4240d3b7d499ae6572aba6mv2.jpg';

export default function Logo({ className = 'h-14' }) {
  return (
    <UIImage
      src={LOGO_URL}
      alt="לגזיאל - תעשיות בע״מ | מצבות מאז 1978"
      fittingType="fit"
      className={className}
      originWidth={300}
      originHeight={380}
    />
  );
}