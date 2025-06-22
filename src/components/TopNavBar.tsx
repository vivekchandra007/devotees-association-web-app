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

    const guestMode: boolean | null = !devotee;
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

    useEffect(() => {
        // Do something on route change
        setIsNavigating(false);
        const stepsDone = Boolean(localStorage.getItem(LOCAL_STORAGE_HIDE_WELCOME_MESSAGE));
        if (authInProgress || pathname.includes('/login') || !guestMode || stepsDone) {
            setShowWelcomeDialogue(false);
        } else {
            setShowWelcomeDialogue(true);
        }
    }, [pathname, authInProgress]);

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
                <Image src="/logo-dark4.png" alt="Home" height="32" width="32" className="invert-100" priority />
            </Button>
            <span className="text-xs mt-1">Madhuram</span>
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
        <small className="text-text">
            ॥ हरे कृष्ण ॥
            { 
                isAuthenticated && devotee && 
                <span>
                    <br />
                    {devotee?.initiated_name || devotee?.name}{devotee?.gender ? `, ${devotee.spiritual_level_id_ref_value[`title_${devotee?.gender}`]}` : ''} 🙏🏻
                </span>
            }
        </small>
    );

    function hideWelcomeMessage() {
        setShowWelcomeDialogue(false);
        if (typeof window !== 'undefined' && !guestMode) {
            localStorage.setItem(LOCAL_STORAGE_HIDE_WELCOME_MESSAGE, "true");
        }
        window.scrollTo(0, 0);
    }

    return (
        <div>
            {/* Welcome message dialogue */}
            <Dialog
                header={title} keepInViewport closeOnEscape={!guestMode}
                visible={showWelcomeDialogue}
                onHide={hideWelcomeMessage}
                className="shadow-2xl w-full md:w-[75vw] lg:w-[45vw] text-center text-text size-fit m-auto">
                <div className="bg-[url('/chant-and-be-happy3.png')] bg-no-repeat bg-center bg-contain">
                    <small className="block text-text mb-4">
                        Congratulations! Thanks to your devotion, we are getting a new beautiful temple in Baner, Pune
                    </small>
                    <div className="text-text">
                        <strong className="font-bilbo text-xl">Shri Shri <span className="text-special text-4xl">Radha Krishna</span>&nbsp;Temple</strong>
                    </div>
                    <small className="text-text">
                        Your turn now. Let&apos;s build it brick by brick, step by step
                    </small>
                    <br /><br />
                    <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                        <div className="col-span-8 md:col-span-10 text-left">
                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                            <small className="text-text">A Once-In-A-Lifetime divine chance to build temple for Shri Shri Radha Krishna — Do not miss. Donate Now!</small>
                        </div>
                        <div className="col-span-4 md:col-span-2 mr-1">
                            <Button label="" severity="warning" raised size="large" className="float-right"
                                icon="pi pi-indian-rupee"
                                onClick={() => window.open("https://iskconpunebcec.com/#/newtemple")}>
                                <Badge severity="warning" value="▸" className="scale-150"></Badge>
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                        <div className="col-span-8 md:col-span-10 text-left">
                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                            <small className="text-text">Join our Whatsapp group to stay updated with the latest news and events — Do not miss. Connect Now!</small>
                        </div>
                        <div className="col-span-4 md:col-span-2 mr-1">
                            <Button label="" severity="success" raised size="large" className="float-right"
                                icon="pi pi-whatsapp"
                                onClick={() => alert('Link to a Whatsapp group')}>
                                <Badge severity="success" value="▸" className="scale-150"></Badge>
                            </Button>
                        </div>
                    </div>
                    {
                        guestMode ?
                            (
                                <>
                                    <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                                        <div className="col-span-8 md:col-span-10 text-left">
                                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                                            <small className="text-text">Claim your free account. Gifts, Online Prayers, Spiritual YouTube... — Do not miss. Login Now!</small>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="danger" raised size="large" className="float-right"
                                                icon="pi pi-crown"
                                                onClick={() =>  router.push(`/login?${searchParams || ''}`)}>
                                                <Badge severity="danger" value="▸" className="scale-150"></Badge>
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) :
                            (
                                <>
                                    <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                                        <div className="col-span-8 md:col-span-10 text-left">
                                            <div className="grid grid-cols-12 items-center">
                                                <div className="col-span-8 md:col-span-7 text-left">
                                                    <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                                                    <small className="text-text">Keep your profile 100% and upto date</small>
                                                </div>
                                                <div className="col-span-4 md:col-span-5">
                                                    <ProfileCompletionMeter devotee={devotee} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="info" raised size="large" className="float-right"
                                                icon="pi pi-user-edit"
                                                onClick={() => router.push('/devotee')}>
                                                <Badge severity="info" value="▸" className="scale-150"></Badge>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                                        <div className="col-span-8 md:col-span-10 text-left">
                                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                                            <small className="text-text">Let&apos;s Spread the word. Refer Others and become a spiritual catalyst in their life.</small>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="secondary" raised size="large" className="float-right"
                                                icon="pi pi-share-alt"
                                                onClick={() => setDialogueModalContent(ReferralsModalContent)} >
                                                <Badge severity="secondary" value="▸" className="scale-150"></Badge>
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )
                    }
                </div>
            </Dialog>
            <span className={classNames("absolute right-0 md:right-2 z-1", guestMode ? 'top-[12vh] md:top-[8.8vh]' : 'top-[23vh] md:top-[13.5vh]')}>
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
            </span>
            {/* Top News Ticker - shown always */}
            {
                !authInProgress &&
                <div className="bg-hover text-white grid items-center m-auto justify-items-center text-center -z-2 min-h-8">
                    <small className="font-semibold hover:underline">
                        <a href="https://iskconpunebcec.com/#/newtemple" target="_blank">
                            <i className="pi pi-megaphone mr-2 animate-pulse"></i>
                            Every brick carries a prayer. Let yours be one of them — Support the New Temple now.
                        </a>
                    </small>
                </div>
            }

            {/* Main Toolbar - shown only when user is logged in */}
            {
                isAuthenticated && devotee &&
                <>
                    <Toolbar start={startContent} center={centerContent} end={endContent} className="component-transparent" style={{ padding: '8px', border: 'none ', boxShadow: 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px' }} />
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