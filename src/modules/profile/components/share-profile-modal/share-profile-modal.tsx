import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui-kit/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui-kit/dialog';
import { Input } from '@/components/ui-kit/input';
import { Share2, Link, Twitter, Linkedin, Facebook, Check, Mail, Download } from 'lucide-react';

interface ShareProfileModalProps {
  username: string;
  displayName: string;
}

export function ShareProfileModal({ username, displayName }: ShareProfileModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/u/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = publicUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Check out ${displayName}'s profile on Universal Profile Engine: ${publicUrl}`
    )}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`,
  };

  const openShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out ${displayName}'s profile`);
    const body = encodeURIComponent(`Hi,\n\nI thought you might be interested in ${displayName}'s profile:\n\n${publicUrl}\n\nBest regards`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDownloadVCard = () => {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${displayName}`,
      `URL:${publicUrl}`,
      'END:VCARD',
    ].join('\n');
    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          {t('SHARE')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('SHARE_PROFILE')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Copy */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('PROFILE_LINK')}</label>
            <div className="flex gap-2">
              <Input value={publicUrl} readOnly className="flex-1" />
              <Button onClick={handleCopy} variant="outline" className="shrink-0">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    {t('COPIED')}
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-1.5" />
                    {t('COPY')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('SHARE_ON')}</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => openShare(shareLinks.twitter)}
                className="flex flex-col items-center gap-1.5 h-auto py-3"
              >
                <Twitter className="w-5 h-5 text-sky-500" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => openShare(shareLinks.linkedin)}
                className="flex flex-col items-center gap-1.5 h-auto py-3"
              >
                <Linkedin className="w-5 h-5 text-blue-700" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => openShare(shareLinks.facebook)}
                className="flex flex-col items-center gap-1.5 h-auto py-3"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
            </div>
          </div>

          {/* More Actions */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('MORE_ACTIONS')}</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleEmailShare}
                className="flex flex-col items-center gap-1.5 h-auto py-3"
              >
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="text-xs">{t('EMAIL')}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadVCard}
                className="flex flex-col items-center gap-1.5 h-auto py-3"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="text-xs">{t('VCARD')}</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
