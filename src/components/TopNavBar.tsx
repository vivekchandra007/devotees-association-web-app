'use client';

import { Menubar } from 'primereact/menubar';
import { MenuItem } from 'primereact/menuitem';
import { Dialog } from 'primereact/dialog';
import { Avatar } from 'primereact/avatar';
import { ProgressBar } from "primereact/progressbar";
import { ReactElement, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // your auth hook
import Image from 'next/image';
import { Menu } from 'primereact/menu';
import { classNames } from 'primereact/utils';
import { SYSTEM_ROLES } from '@/data/constants';
import Devotee from './Devotee';

type dialogueModalContentType = {
    header: string,
    content: ReactElement,
    width?: string,
    footer?: ReactElement
};

export default function TopNavBar() {
    const { devotee, systemRole, logout } = useAuth();
    const [inProgress] = useState<boolean>(false);
    const userProfileModalContent = (firstTime: boolean) => {
        return {
            header: firstTime? 'Keep your profile up to date':'Edit Profile',
            content: (
                devotee?.id? <Devotee devoteeId={devotee?.id} /> : <></>
            ),
            width: '99vw'
        }
    }

    const [dialogueModalContent, setDialogueModalContent] = useState<dialogueModalContentType | null>(userProfileModalContent(true));
    const userProfileActionsPanel = useRef<Menu>(null);

    const topMenuItems: MenuItem[] = [
        {
            label: 'Home',
            icon: 'pi pi-fw pi-home',
            url: '/'
        },
        {
            label: 'Edit My Profile',
            icon: 'pi pi-fw pi-user-edit',
            command: () => { setDialogueModalContent(userProfileModalContent(false)) }
        },
        {
            label: 'Devotees',
            visible: systemRole !== SYSTEM_ROLES.member,
            icon: 'pi pi-fw pi-users',
            items: [
                {
                    label: 'Add New Devotee',
                    icon: 'pi pi-fw pi-user-plus',
                    command: () => { setDialogueModalContent(AddNewDevoteeModalContent) }
                },
                {
                    label: 'View Devotee',
                    icon: 'pi pi-fw pi-user',
                    command: () => { setDialogueModalContent(ViewDevoteeDetailsModalContent) }
                },
            ]
        },
        {
            label: 'Referrals',
            icon: 'pi pi-fw pi-share-alt',
            command: () => { setDialogueModalContent(ReferralsModalContent) }
        },
    ];

    const ReferralsModalContent = {
        header: 'Referrals',
        content: (<p>Referrals Component Form</p>),
        width: '50vw'
    }

    const AddNewDevoteeModalContent = {
        header: 'Add New Devotee',
        content: (<p>Add New Devotee Component Form</p>),
        width: '50vw'
    }

    const ViewDevoteeDetailsModalContent = {
        header: 'View Devotee Details',
        content: (<p>View Devotee Component Form</p>),
        width: '50vw'
    }

    const settingsModalContent = {
        header: 'Settings',
        content: (
            <p>Settings Component Modal</p>
        ),
        width: '50vw'
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
            command: () => { setDialogueModalContent(userProfileModalContent(false)) }
        },
        {
            label: 'Add New Devotee', 
            visible: systemRole !== SYSTEM_ROLES.member,
            icon: 'pi pi-fw pi-user-plus',
            command: () => { setDialogueModalContent(AddNewDevoteeModalContent) }
        },
        {
            label: 'View Devotee',
            visible: systemRole !== SYSTEM_ROLES.member,
            icon: 'pi pi-fw pi-user',
            command: () => { setDialogueModalContent(ViewDevoteeDetailsModalContent) }
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
                            <span className="font-bold">{devotee?.initiated_name || ''}
                                <span className={classNames(devotee?.initiated_name? '' : 'font-bold','capitalize')}>
                                    {
                                        (devotee?.initiated_name || '') + (devotee?.initiated_name ? 'aka. ' : '') + (devotee?.name || '') + ('    ') + (devotee?.gender ? devotee.spiritual_levels[`title_${devotee?.gender}`] : '' )
                                    }
                                </span>
                            </span>
                            <span className="flex text-sm">{`+${devotee?.phone?.slice(0,2)}-${devotee?.phone?.slice(2)}` || ''}</span>
                        </div>
                    </button>
                )
            }
        }
    ];

    const end = (
        <div className="card flex justify-content-center">
            <Avatar className="p-1 border-2 border-amber-200 shadow-inner shadow-amber-200" image="/devotee-user-icon-transparent.gif" size="xlarge" shape="circle"
                onClick={e => userProfileActionsPanel?.current?.toggle(e)} />
            <Menu className="component-transparent" model={topRightMenuItems} popup ref={userProfileActionsPanel} style={{ width: '250px' }} />
        </div>
    );

    const hideDialogueModal = () => {
        setDialogueModalContent(null);
    }

    return (
        <div>
            <Menubar className="component-transparent" model={topMenuItems} end={end} />
            {inProgress ? <ProgressBar mode="indeterminate" style={{ height: '2px' }}></ProgressBar> : ''}

            <Dialog className="navbar-dialogue" header={dialogueModalContent ? dialogueModalContent.header : ''}
                visible={!!dialogueModalContent} style={{ width: dialogueModalContent?.width || '90vw' }}
                onHide={hideDialogueModal} footer={dialogueModalContent?.footer || ''}>
                <span className="mb-5">
                    {dialogueModalContent?.content || ''}
                </span>
            </Dialog>
        </div>
    );
}