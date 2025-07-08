'use client';

import { MenuItem } from 'primereact/menuitem';
import { Dialog } from 'primereact/dialog';
import { Avatar } from 'primereact/avatar';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // your auth hook
import Image from 'next/image';
import { Menu } from 'primereact/menu';
import { classNames } from 'primereact/utils';
import Referrals from './Referrals';
import { useRouter } from "next/navigation";
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { usePathname, useSearchParams } from 'next/navigation';
import { SYSTEM_ROLES } from '@/data/constants';
import { Badge } from 'primereact/badge';
import ProfileCompletionMeter from './ProfileCompletionMeter';

type dialogueModalContentType = {
    header: string,
    content: ReactElement,
    footer?: ReactElement
};

export default function TopNavBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { devotee, isAuthenticated, authInProgress, systemRole, logout } = useAuth();

    const [isNavigating, setIsNavigating] = useState<boolean>(false);

    const underConstructionPlaceholder = ' (under construction, not yet live)';

    const [dialogueModalContent, setDialogueModalContent] = useState<dialogueModalContentType | null>();

    const [guestMode, setGuestMode] = useState<boolean>(false);
    const LOCAL_STORAGE_HIDE_WELCOME_MESSAGE = "hideWelcomeMessage";
    const [showWelcomeDialogue, setShowWelcomeDialogue] = useState<boolean>(false);

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
            label: 'Profile',
            icon: 'pi pi-fw pi-user-edit',
            command: () => navigateToPage('devotee')
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
                                        (devotee?.name || '') + ('    ') + (devotee?.gender && !devotee?.initiated_name ? devotee.spiritual_level_id_ref_value[`title_${devotee?.gender}`] : '')
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

    function navigateToPage(page: string) {
        if (pathname !== `/${page}`) {
            setIsNavigating(true);
            router.push(`/${page}`);
        }
    }

    function showDoNotShowWelcomeDialogue() {
        const stepsDone = Boolean(localStorage.getItem(LOCAL_STORAGE_HIDE_WELCOME_MESSAGE));
        if (window.location.toString().includes('/login') || stepsDone) {
            setShowWelcomeDialogue(false);
        } else {
            if (guestMode || !stepsDone) {
                setShowWelcomeDialogue(true);
                if (guestMode) {
                    setTimeout( showDoNotShowWelcomeDialogue, 300000);
                }
            }
        }
    }

    useEffect(() => {
        setIsNavigating(false);
        setGuestMode(false);
        if (!pathname.includes('/login') && searchParams && searchParams.size > 0 && searchParams.get('guest')) {
            setGuestMode(Boolean(searchParams.get('guest')));
        }
        // Do something on route change
        showDoNotShowWelcomeDialogue();
    }, [pathname, guestMode]);

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
                onClick={() => navigateToPage('')}
            >
                <Image src="/metadata/icon.png" alt="Home" height="32" width="32" priority />
            </Button>
            <span className="text-xs mt-1">Hare Krishna</span>
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
                    onClick={() => navigateToPage('devotee')}
                />
                <span className="text-xs mt-1">My Data</span>
            </span>
            {
                systemRole === SYSTEM_ROLES.member ?
                    (
                        <span className="flex flex-col items-center space-y-1">
                            <Button
                                icon="pi pi-indian-rupee"
                                rounded
                                text
                                raised
                                severity="contrast"
                                aria-label="Donations"
                                size="large"
                                onClick={() => navigateToPage('devotee/donations')}
                            />
                            <span className="text-xs mt-1">Donations</span>
                        </span>
                    )
                    :
                    (
                        <span className="flex flex-col items-center space-y-1">
                            <Button
                                icon="pi pi-database"
                                rounded
                                text
                                raised
                                severity="contrast"
                                aria-label="User Data"
                                size="large"
                                onClick={() => navigateToPage('user-data')}
                            />
                            <span className="text-xs mt-1">User Data</span>
                        </span>
                    )
            }
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

    const title = (
        <small className="font-bilbo text-text text-xl md:text-2xl lg:text-4xl">
            Hare Krishna!
            <br/>
            {
                isAuthenticated && devotee &&
                <span className="text-special">
                                {devotee?.initiated_name || devotee?.name}{devotee?.gender ? `, ${devotee.spiritual_level_id_ref_value[`title_${devotee?.gender}`]}` : ''} 🙏🏻
                            </span>
            }
        </small>
    );

    function hideWelcomeMessage() {
        if (typeof window !== 'undefined') {
            setShowWelcomeDialogue(false);
            const prevValueOfHideWelcomeMessage = localStorage.getItem(LOCAL_STORAGE_HIDE_WELCOME_MESSAGE);
            if (!guestMode) {
                localStorage.setItem(LOCAL_STORAGE_HIDE_WELCOME_MESSAGE, "true");
            }
            if (!guestMode && !Boolean(prevValueOfHideWelcomeMessage)) {
                window.location.reload();
            }
            window.scrollTo(0, 0);
        }
    }

    return (
        <div>
            {/* Welcome message dialogue */}
            <Dialog
                header={title} keepInViewport closeOnEscape
                visible={showWelcomeDialogue}
                onHide={hideWelcomeMessage}
                className="shadow-2xl w-[94vw] md:w-[75vw] lg:w-[45vw] text-center text-text size-fit m-auto">
                <div className="bg-[url('/chant-and-be-happy3.png')] bg-no-repeat bg-center bg-contain pb-0">
                    {
                        guestMode ?
                            (
                                <>
                                    <div
                                        className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                                        <div className="col-span-8 md:col-span-10 text-left">
                                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                                            <small className="text-text">Claim your free account. Gifts, Online Prayers,
                                                Spiritual YouTube... All Free for a limited time — Do not miss. Login Now!</small>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="danger" raised
                                                    className="float-right"
                                                    icon="pi pi-crown"
                                                    onClick={() => router.push(`/login?${searchParams || ''}`)}>
                                                <Badge severity="danger" value="▸" className="scale-150"></Badge>
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) :
                            (
                                <>
                                    <small className="text-text">
                                        Have you completed the following yet?&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    </small>
                                    <div
                                        className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                                        <div className="col-span-8 md:col-span-10 text-left">
                                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                                            <small className="text-text">A Once-In-A-Lifetime chance to help build a
                                                temple — Do not
                                                miss. Donate Now!</small>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="warning" raised className="float-right"
                                                    icon="pi pi-indian-rupee"
                                                    onClick={() => window.open("https://iskconpunebcec.com/#/newtemple")}>
                                                <Badge severity="warning" value="▸" className="scale-150"></Badge>
                                            </Button>
                                        </div>
                                    </div>
                                    <div
                                        className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                                        <div className="col-span-8 md:col-span-10 text-left">
                                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                                            <small
                                                data-pr-tooltip="Join our Whatsapp group to stay updated with the latest news and events — Do not miss. Connect Now!"
                                                className="text-text">
                                                Join our Whatsapp group
                                            </small>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="success" raised size="small"
                                                    className="float-right"
                                                    icon="pi pi-whatsapp"
                                                    onClick={() => alert('Link to a Whatsapp group')}>
                                                <Badge severity="success" value="▸" className="scale-150"></Badge>
                                            </Button>
                                        </div>
                                    </div>
                                    <div
                                        className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                                        <div className="col-span-8 md:col-span-10 text-left">
                                            <div className="grid grid-cols-12 items-center">
                                                <div className="col-span-8 md:col-span-7 text-left">
                                                    <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                                                    <small className="text-text">Keep profile up to date</small>
                                                </div>
                                                <div className="col-span-4 md:col-span-5">
                                                    <ProfileCompletionMeter devotee={devotee}/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="info" raised size="small" className="float-right"
                                                    icon="pi pi-user-edit"
                                                    onClick={() => router.push('/devotee')}>
                                                <Badge severity="info" value="▸" className="scale-150"></Badge>
                                            </Button>
                                        </div>
                                    </div>
                                    <div
                                        className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                                        <div className="col-span-8 md:col-span-10 text-left">
                                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                                            <small
                                                data-pr-tooltip="Let's Spread the word. Refer Others and become a spiritual catalyst in their life."
                                                className="text-text">
                                                Refer Others, Earn Blessings
                                            </small>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="secondary" raised size="small"
                                                    className="float-right"
                                                    icon="pi pi-share-alt"
                                                    onClick={() => setDialogueModalContent(ReferralsModalContent)}>
                                                <Badge severity="secondary" value="▸" className="scale-150"></Badge>
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )
                    }
                    <br/>
                    <Button label={guestMode? 'Take me to Login screen' : 'Close'} severity="danger" size="small" className="w-full" outlined={!guestMode}
                            onClick={guestMode? () => router.push(`/login?${searchParams || ''}`) : hideWelcomeMessage}/>
                </div>
            </Dialog>
            {/*<span className={classNames("absolute right-0 md:right-2 z-1", guestMode ? 'top-[12vh] md:top-[11vh]' : 'top-[23vh] md:top-[16vh]')}>
                <Button
                    rounded
                    raised
                    className="hover:animate-pulse"
                    severity="secondary"
                    aria-label="Steps"
                    size="small"
                    title="Open Welcome Page again to view checklist"
                    onClick={() => setShowWelcomeDialogue(true)}
                >
                    <i className="pi pi-bell cursor-pointer text-white p-overlay-badge">
                        <Badge severity="danger" className="scale-50"></Badge>
                    </i>
                </Button>
            </span>*/}
            {/* Top News Ticker - shown always */}
            {
                !authInProgress && (devotee || guestMode) && !pathname.includes('/login') &&
                <div
                    className="bg-hover text-white grid items-center m-auto justify-items-center text-center -z-2 min-h-8">
                    <small className="font-semibold hover:underline cursor-pointer">
                        <a onClick={() => setShowWelcomeDialogue(true)} target="_blank">
                            <i className="pi pi-megaphone mr-2 animate-pulse"></i>
                            Every brick carries a prayer. Let yours be one of them — Support the New Temple now.
                            <span className="underline pl-2">Click here.</span>
                        </a>
                    </small>
                </div>
            }

            {/* Main Toolbar - shown only when user is logged in */}
            {
                isAuthenticated && devotee &&
                <>
                    <Toolbar start={startContent} center={centerContent} end={endContent}
                             className="component-transparent" style={{
                        padding: '8px',
                        border: 'none ',
                        boxShadow: 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px'
                    }}/>
                    {
                        isNavigating &&
                        <ProgressBar mode="indeterminate" style={{ height: '4px' }}></ProgressBar>
                    }
                    <Dialog
                        header={dialogueModalContent ? dialogueModalContent.header : ''} keepInViewport
                        visible={!!dialogueModalContent}
                        onHide={hideDialogueModal} footer={dialogueModalContent?.footer || ''}>
                        <span className="mb-5">
                            {dialogueModalContent?.content || ''}
                        </span>
                    </Dialog>
                </>
            }
        </div>
    );
}