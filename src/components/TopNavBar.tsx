'use client';

import { Menubar } from 'primereact/menubar';
import { MenuItem } from 'primereact/menuitem';
import { Dialog } from 'primereact/dialog';
import { Avatar } from 'primereact/avatar';
import {ProgressBar} from "primereact/progressbar";
import { ReactElement, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // your auth hook
import Image from 'next/image';
import { Menu } from 'primereact/menu';
import { classNames } from 'primereact/utils';

type dialogueModalContentType = {
    header: string,
    content: ReactElement,
    width?: string,
    footer?: ReactElement
  };

export default function TopNavBar() {
    const { devotee, systemRole, logout } = useAuth();
    const [inProgress] = useState<boolean>(false);
    const [dialogueModalContent, setDialogueModalContent] = useState<dialogueModalContentType | null>(null);
    const userProfileActionsPanel = useRef<Menu>(null);

    const topMenuItems: MenuItem[] = [
        {
            label: 'Home',
            icon: 'pi pi-fw pi-home',
            url: '/'
        },
        {
            label: 'My Profile',
            icon: 'pi pi-fw pi-user-edit',
            command: () => { setDialogueModalContent(userProfileModalContent) }
        },
        {
            label: 'Devotees',
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
        }
    ];
    const userProfileModalContent = {
        header: 'Edit Profile',
        content: (
            <>
                <p><strong>Name:</strong> {devotee?.name}</p>
                <p><strong>Phone:</strong> {devotee?.phone}</p>
                <p><strong>Role:</strong> {systemRole}</p>
            </>
        )
    }

    const AddNewDevoteeModalContent = {
        header: 'Add New Devotee',
        content: (<p>Add New Devotee Component Form</p>),
        width: '50vw'
    }

    const ViewDevoteeDetailsModalContent = {
        header: 'View Devotee Details',
        content: (<p>View Devotee Component Form</p>),
        width: '25.5vw'
    }

    const start = (
        <Image
            src="/logo.png"
            alt="App logo"
            width="48"
            height="48"
            priority
        />
    );

    const settingsModalContent = {
        header: 'Settings',
        content: (
            <p>Settings Component Modal</p>
        ),
        width: '45vw'
    }

    const topRightMenuItems: MenuItem[] = [
        {
            label: 'Add New Devotee', icon: 'pi pi-fw pi-user-plus',
            command: () => { setDialogueModalContent(AddNewDevoteeModalContent) }
        },
        {
            label: 'Edit My Profile', icon: 'pi pi-fw pi-user',
            command: () => { setDialogueModalContent(userProfileModalContent) }
        },
        { label: 'Settings', icon: 'pi pi-fw pi-cog', command: () => { setDialogueModalContent(settingsModalContent) } },
        { label: 'Log out', icon: 'pi pi-sign-out', className: "", command: () => { logout() } },
        { separator: true },
        {
            command: () => { alert('test') },
            template: (item, options) => {
                return (
                    <>
                        <Image
                            src="/chanting-animation.gif"
                            alt="User Picture"
                            height="190"
                            width="190"
                        />
                        <button onClick={(e) => options.onClick(e)} className={classNames(options.className, 'w-full p-link flex align-items-center')}>
                            <Avatar image="/devotee-user-icon.gif" className="mr-2" shape="circle" />
                            <div className="flex flex-column align">
                                <span className="font-bold">{devotee?.diksha_name || ''}</span>
                                <span className={devotee?.diksha_name? '':'font-bold'}>
                                    {
                                        (devotee?.diksha_name? 'aka. ':'') + (devotee?.name || 'Deva')
                                    }
                                </span>
                                <span className="text-sm">{devotee?.phone || ''}</span>
                            </div>
                        </button>
                    </>
                )
            }
        }
    ];

    const end = (
        <div className="card flex justify-content-center">
            <Avatar image="/devotee-user-icon.gif" size="large" shape="circle"
                    onClick={e => userProfileActionsPanel.current.toggle(e)}/>
            <Menu model={topRightMenuItems} popup ref={userProfileActionsPanel} style={{ width: '250px' }}/>
        </div>
    );

    const hideDialogueModal = () => {
        setDialogueModalContent(null);
    }

    return (
        <div>
            <Menubar model={topMenuItems} start={start} end={end} />
            {inProgress ? <ProgressBar mode="indeterminate" style={{ height: '2px' }}></ProgressBar> : ''}
            
            <Dialog header={dialogueModalContent ? dialogueModalContent.header : ''}
                visible={!!dialogueModalContent} style={{ width: dialogueModalContent?.width || '90vw' }}
                onHide={hideDialogueModal} footer={dialogueModalContent?.footer || ''}>
                <span className="mb-5">
                    {dialogueModalContent?.content || ''}
                </span>
            </Dialog>
        </div>
    );
}