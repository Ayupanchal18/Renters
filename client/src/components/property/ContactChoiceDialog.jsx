import { Phone, MessageCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import {
    generateWhatsAppCallLink,
    generateWhatsAppMessageLink,
    createPropertyInquiryMessage,
    isValidWhatsAppPhone,
} from '../../utils/whatsappUtils';

/**
 * WhatsApp icon component
 */
const WhatsAppIcon = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

/**
 * ContactChoiceDialog - A dialog that presents contact method options
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {function} props.onClose - Callback when dialog should close
 * @param {'call' | 'message'} props.mode - The contact mode (call or message)
 * @param {string} props.phone - The owner's phone number
 * @param {string} props.propertyTitle - The title of the property
 * @param {function} props.onAppAction - Callback for app's native action
 */
export default function ContactChoiceDialog({
    isOpen,
    onClose,
    mode,
    phone,
    propertyTitle,
    onAppAction,
}) {
    const hasValidPhone = isValidWhatsAppPhone(phone);

    const handleAppAction = () => {
        onAppAction?.();
        onClose();
    };

    const handleWhatsAppAction = () => {
        let link;
        if (mode === 'call') {
            link = generateWhatsAppCallLink(phone);
        } else {
            const message = createPropertyInquiryMessage(propertyTitle);
            link = generateWhatsAppMessageLink(phone, message);
        }

        if (link) {
            window.open(link, '_blank', 'noopener,noreferrer');
        }
        onClose();
    };

    const isCallMode = mode === 'call';
    const title = isCallMode ? 'Choose how to call' : 'Choose how to message';
    const description = isCallMode
        ? 'Select your preferred method to contact the owner'
        : 'Select your preferred method to send a message';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-4">
                    {/* App's native option */}
                    <Button
                        variant="outline"
                        className="w-full h-auto p-4 justify-start gap-4"
                        onClick={handleAppAction}
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {isCallMode ? (
                                <Phone className="w-5 h-5 text-primary" />
                            ) : (
                                <MessageCircle className="w-5 h-5 text-primary" />
                            )}
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-foreground">
                                {isCallMode ? 'Call Directly' : 'Message in App'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {isCallMode
                                    ? 'Use your phone to call'
                                    : 'Send a message through the app'}
                            </p>
                        </div>
                    </Button>

                    {/* WhatsApp option - only show if phone is valid */}
                    {hasValidPhone && (
                        <Button
                            variant="outline"
                            className="w-full h-auto p-4 justify-start gap-4 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30"
                            onClick={handleWhatsAppAction}
                        >
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <WhatsAppIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-foreground">
                                    {isCallMode ? 'Call via WhatsApp' : 'Message via WhatsApp'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isCallMode
                                        ? 'Start a WhatsApp call'
                                        : 'Send a WhatsApp message'}
                                </p>
                            </div>
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
