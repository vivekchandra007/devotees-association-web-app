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
import Referrals from './Referrals';
import DonationsDashboard from './DonationsDashboard';
import { InputText } from 'primereact/inputtext';
import { useRouter } from "next/navigation";

type dialogueModalContentType = {
    header: string,
    content: ReactElement,
    footer?: ReactElement
};

export default function TopNavBar() {
    const router = useRouter();
    const { devotee, isAuthenticated, systemRole, logout } = useAuth();
    const [inProgress] = useState<boolean>(false);

    const underConstructionPlaceholder = ' (under construction, not yet live)';

    const [dialogueModalContent, setDialogueModalContent] = useState<dialogueModalContentType | null>();
    const [devoteeName, setDevoteeName] = useState<string>('');
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
            label: 'View Devotee',
            visible: systemRole !== SYSTEM_ROLES.member,
            icon: 'pi pi-fw pi-user',
            command: () => { setDialogueModalContent(ViewDevoteeDetailsModalContent) }
        },
        {
            label: "Devotees",
            visible: systemRole === SYSTEM_ROLES.admin, 
            icon: 'pi pi-fw pi-user-edit',
            command: () => { setDialogueModalContent(ViewDevoteesDataModalContent) }
        },
        {
            label: 'Donations',
            visible: systemRole === SYSTEM_ROLES.admin,
            icon: 'pi pi-fw pi-user',
            command: () => { setDialogueModalContent(ViewDonationsDataModalContent) }
        },
        {
            label: 'Referrals',
            icon: 'pi pi-fw pi-share-alt',
            command: () => { setDialogueModalContent(ReferralsModalContent) }
        },
    ];

    const userProfileModalContent = (firstTime: boolean, self?: boolean) => {
        if (firstTime && !devotee?.name && self) {
            return {
                header: '',
                content: (
                    <div className="p-inputgroup mt-2 sm:mt-7">
                        <span className="p-inputgroup-addon">
                            <i className="pi pi-user"></i>
                        </span>
                        <span className="p-float-label">
                            <InputText id="name" required maxLength={100}
                                value={devoteeName}
                                onChange={(e) => {
                                    setDevoteeName(e.target.value);
                                }}
                                className={classNames({ 'p-invalid': !!devoteeName })} />
                            <label className="capitalize"
                                htmlFor="name">Name</label>
                        </span>
                    </div>
                )
            }
        } else {
            router.push('/devotee');
        }
    }

    const ReferralsModalContent = {
        header: 'Referrals',
        content: (<Referrals />)
    }

    const ViewDevoteeDetailsModalContent = {
        header: 'View Devotee Details' + underConstructionPlaceholder,
        content: (<p>View Devotee Component Form</p>)
    }

    const ViewDevoteesDataModalContent = {
        header: 'All Devotees' + underConstructionPlaceholder,
        content: (<p>View All Devotees Component Form</p>)
    }

    const ViewDonationsDataModalContent = {
        header: 'Donations' + underConstructionPlaceholder,
        content: (<DonationsDashboard />)
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
            command: () => { setDialogueModalContent(userProfileModalContent(false)) }
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

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div>
            <Menubar className="component-transparent" model={topMenuItems} end={end} />
            {inProgress ? <ProgressBar mode="indeterminate" style={{ height: '2px' }}></ProgressBar> : ''}

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