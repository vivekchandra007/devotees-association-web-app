'use client';

import { MenuItem } from 'primereact/menuitem';
import { Dialog } from 'primereact/dialog';
import { Avatar } from 'primereact/avatar';
import { ReactElement, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // your auth hook
import Image from 'next/image';
import { Menu } from 'primereact/menu';
import { classNames } from 'primereact/utils';
import Referrals from './Referrals';
import { useRouter } from "next/navigation";
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';

type dialogueModalContentType = {
    header: string,
    content: ReactElement,
    footer?: ReactElement
};

export default function TopNavBar() {
    const router = useRouter();
    const { devotee, isAuthenticated, logout } = useAuth();

    const underConstructionPlaceholder = ' (under construction, not yet live)';

    const [dialogueModalContent, setDialogueModalContent] = useState<dialogueModalContentType | null>();

    const userProfileActionsPanel = useRef<Menu>(null);

    const ReferralsModalContent = {
        header: 'Referrals',
        content: (<Referrals />)
    }

    const settingsModalContent = {
        header: 'Settings' + underConstructionPlaceholder,
        content: (
            <p>Settings Component Modal</p>
        )
    }

    const topRightMenuItems: MenuItem[] = [
        {
            template: () => {
                return (
                    <span className="flex justify-center">
                        <Image
                            src="/chanting-animation-transparent.gif"
                            alt="User Picture"
                            height="190"
                            width="190"
                            unoptimized
                        />
                    </span>
                )
            }
        },
        {
            label: 'Edit My Profile',
            icon: 'pi pi-fw pi-user-edit',
            command: () => router.push('/devotee')
        },
        {
            label: 'Referrals',
            icon: 'pi pi-fw pi-share-alt',
            command: () => { setDialogueModalContent(ReferralsModalContent) }
        },
        { label: 'Settings', icon: 'pi pi-fw pi-cog', command: () => { setDialogueModalContent(settingsModalContent) } },
        { label: 'Log out', icon: 'pi pi-sign-out', className: "ml-1", command: () => { logout() } },
        { separator: true },
        {
            command: () => { alert('test') },
            template: (item, options) => {
                return (
                    <button onClick={(e) => options.onClick(e)} className={classNames(options.className, 'w-full p-link flex align-items-center')}>
                        <Avatar className="grid m-1" image="/devotee-user-icon.png" size="large" shape="circle" />
                        <div>
                            {
                                devotee?.initiated_name &&
                                (
                                    <span className="flex font-bold capitalize">
                                        {devotee?.initiated_name || ''}
                                    </span>
                                )
                            }
                            <span className={classNames(devotee?.initiated_name ? '' : 'font-bold')}>
                                {
                                    (devotee?.initiated_name ? 'aka. ' : '')
                                }
                                <span className="capitalize">
                                    {
                                        (devotee?.name || '') + ('    ') + (devotee?.gender && !devotee?.initiated_name ? devotee.spiritual_levels[`title_${devotee?.gender}`] : '')
                                    }
                                </span>
                            </span>
                            <span className="flex text-sm">{`+${devotee?.phone?.slice(0, 2)}-${devotee?.phone?.slice(2)}` || ''}</span>
                        </div>
                    </button>
                )
            }
        }
    ];

    const hideDialogueModal = () => {
        setDialogueModalContent(null);
    }

    if (!isAuthenticated) {
        return null;
    }

    const startContent = (
        <span className="flex flex-col items-center space-y-1">
            <Button
                rounded
                text
                raised
                severity="contrast"
                aria-label="Home"
                size="large"
                style={{ padding: '8px' }}
                onClick={() => router.push('/')}
            >
                <Image src="/logo-dark.png" alt="Home" height="32" width="32" className="invert-100" priority />
            </Button>
            <span className="text-xs mt-1">Home</span>
        </span>
    );
    const centerContent = (
        <div className="flex flex-wrap align-items-center gap-4">
            <span className="flex flex-col items-center space-y-1">
                <Button
                    icon="pi pi-user-edit"
                    rounded
                    text
                    raised
                    severity="contrast"
                    aria-label="Edit Profile"
                    size="large"
                    onClick={() => router.push('/devotee')}
                />
                <span className="text-xs mt-1">Profile</span>
            </span>
            <span className="flex flex-col items-center space-y-1">
                <Button
                    icon="pi pi-indian-rupee"
                    rounded
                    text
                    raised
                    severity="contrast"
                    aria-label="Donations"
                    size="large"
                    onClick={() => router.push('/donations')}
                />
                <span className="text-xs mt-1">Donations</span>
            </span>
            <span className="flex flex-col items-center space-y-1">
                <Button
                    icon="pi pi-share-alt"
                    rounded
                    text
                    raised
                    severity="contrast"
                    aria-label="Referrals"
                    size="large"
                    onClick={() => setDialogueModalContent(ReferralsModalContent)}
                />
                <span className="text-xs mt-1">Referrals</span>
            </span>
        </div>
    );
    const endContent = (
        <div className="flex justify-content-center">
            <div>
                <span className="flex flex-col items-center space-y-1">
                    <Button
                        rounded
                        text
                        raised
                        severity="contrast"
                        aria-label="Home"
                        size="large"
                        style={{ padding: '0px' }}
                        onClick={e => userProfileActionsPanel?.current?.toggle(e)} 
                    >
                        <Avatar className="p-1 border-2 border-amber-200 shadow-inner shadow-amber-200" image="/devotee-user-icon-transparent.gif" size="large" shape="circle"
                        />
                    </Button>
                    <span className="text-xs mt-1">You</span>
                </span>
            </div>
            <Menu className="component-transparent" model={topRightMenuItems} popup ref={userProfileActionsPanel} style={{ width: '250px' }} />
        </div>
    );

    return (
        <div>
            <Toolbar start={startContent} center={centerContent} end={endContent} className="shadow-2 component-transparent" style={{ padding: '8px' }} />
            <Dialog
                header={dialogueModalContent ? dialogueModalContent.header : ''}
                visible={!!dialogueModalContent}
                onHide={hideDialogueModal} footer={dialogueModalContent?.footer || ''}>
                <span className="mb-5">
                    {dialogueModalContent?.content || ''}
                </span>
            </Dialog>
        </div>
    );
}