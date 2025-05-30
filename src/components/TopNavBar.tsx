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
import { Checkbox } from 'primereact/checkbox';
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

    const { devotee, isAuthenticated, systemRole, logout } = useAuth();

    const [isNavigating, setIsNavigating] = useState<boolean>(false);

    const underConstructionPlaceholder = ' (under construction, not yet live)';

    const [dialogueModalContent, setDialogueModalContent] = useState<dialogueModalContentType | null>();

    const guestMode: boolean | null = !devotee;
    const LOCAL_STORAGE_STEPS_COMPLETED = "stepsCompleted";
    const [showWelcomeDialogue, setShowWelcomeDialogue] = useState<boolean>(false);
    const [stepsCompleted, setStepsCompleted] = useState<boolean>(false);

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

    function navigateToPage(page: string) {
        if (pathname !== `/${page}` || searchParams.size > 0) {
            setIsNavigating(true);
            router.push(`/${page}`);
        }
    }

    useEffect(() => {
        // Do something on route change
        setIsNavigating(false);
    }, [pathname, searchParams]);

    function showRepetitiveWelcomeMessageInGuestMode() {
        if (typeof window !== 'undefined') {
            const stepsDone = !!Boolean(localStorage.getItem(LOCAL_STORAGE_STEPS_COMPLETED));
            if (guestMode || !stepsDone) {
                // if user is in guest mode or has not completed steps or welcome dialogue is not already shown
                // show welcome message in guest mode at coded intervals
                // 11 minutes in guest mode and 21 minutes in logged in mode
                if (!showWelcomeDialogue) {
                    const repetiionTime = guestMode ? (1000 * 60 * 11) : (1000 * 60 * 21);
                    setTimeout(() => {
                        // insist user to complete steps by showing welcome dialogue
                        setShowWelcomeDialogue(true);
                        showRepetitiveWelcomeMessageInGuestMode();
                    }, repetiionTime);
                }
            }
        }
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stepsDone = !!Boolean(localStorage.getItem(LOCAL_STORAGE_STEPS_COMPLETED));
            if (!guestMode) {
                setStepsCompleted(stepsDone);
                if (!stepsDone) {
                    showRepetitiveWelcomeMessageInGuestMode();
                }
            } else {
                // in case of Guest Mode, always show the repetitive welcome message at coded intervals
                showRepetitiveWelcomeMessageInGuestMode();
            }
        }
    }, [guestMode]);

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
                    onClick={() => navigateToPage('devotee')}
                />
                <span className="text-xs mt-1">My Profile</span>
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
                                onClick={() => navigateToPage('donations')}
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

    const steps: number = guestMode ? 3 : 4;

    const title = (
        <small className="text-text">
            ॥ हरे कृष्ण ॥
            <br />
            {devotee?.initiated_name || devotee?.name}{devotee?.gender ? `, ${devotee.spiritual_levels[`title_${devotee?.gender}`]}` : ''} 🙏🏻
        </small>
    );

    const guestModeFooter = (
        <div className="w-full text-left text-text">
            <small>
                <strong>Note: We recommed you complete all the above steps at earliest, especially Step 3 to register and create profile, to enjoy seamless blissfull experience.</strong>
            </small>
        </div>
    )

    const footer = (
        <div className={classNames('grid items-center mt-5', stepsCompleted ? "grid-cols-12" : "")}>
            <div className={classNames('text-left', stepsCompleted ? "col-span-6" : "")}>
                <small onClick={() => setStepsCompleted(!stepsCompleted)} className="cursor-pointer">
                    <Checkbox
                        checked={stepsCompleted}>
                    </Checkbox>
                    &nbsp;&nbsp;&nbsp;I have completed all the above {steps} steps.
                </small>
            </div>
            {
                stepsCompleted &&
                <div className="col-span-6">
                    <Button
                        size="small"
                        onClick={() => hideWelcomeMessage(true)}
                        label="Don&apos;t show this message again."
                        severity="danger"
                        raised
                    />
                </div>
            }
        </div>
    );

    function hideWelcomeMessage(stepsCompleted?: boolean) {
        setShowWelcomeDialogue(false);
        if (stepsCompleted) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(LOCAL_STORAGE_STEPS_COMPLETED, "true");
            }
        } else {
            showRepetitiveWelcomeMessageInGuestMode();
        }
        window.scrollTo(0, 0);
    }

    return (
        <div>
            {/* Welcome message dialgue */}
            <Dialog
                header={title} keepInViewport closeOnEscape={!guestMode}
                visible={showWelcomeDialogue}
                footer={guestMode ? guestModeFooter : (typeof window !== 'undefined' && !Boolean(localStorage.getItem(LOCAL_STORAGE_STEPS_COMPLETED)) && footer)}
                onHide={() => hideWelcomeMessage()}
                className="shadow-2xl w-full md:w-[75vw] lg:w-[45vw] text-center text-text size-fit m-auto">
                <div>
                    <small className="block text-text mb-4">
                        Congratulations! Thanks to your devotion, we are getting a new beautiful temple in Baner, Pune
                    </small>
                    <div className="text-text">
                        <strong className="font-bilbo md:text-4xl">Shri Shri <span className="text-7xl text-special">Radha Krishna</span>&nbsp;Temple</strong>
                    </div>
                    <Image
                        className="m-auto"
                        src="/chant-and-be-happy.png"
                        alt="Devotees' Association"
                        width={200}
                        height={214}
                        priority
                    />
                    <br />
                    <small className="text-text">
                        So, now it&apos;s your turn.
                        <br />
                        Let&apos;s build it brick by brick, step by step
                    </small>
                    <br /><br />
                    <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                        <div className="col-span-8 md:col-span-10 text-left">
                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                            <small className="text-text"><strong className="text-hover">Step 1:</strong> A Once-In-A-Lifetime, divine chance to dearly serve Shri Shri Radha Krishna — build their eternal home in your area. Do Not Miss. Donate today.</small>
                        </div>
                        <div className="col-span-4 md:col-span-2 mr-1">
                            <Button label="" severity="warning" raised size="small" className="float-right"
                                icon="pi pi-indian-rupee"
                                onClick={() => window.open("https://iskconpunebcec.com/#/newtemple")}>
                                <Badge severity="warning" value="▸" className="scale-150"></Badge>
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                        <div className="col-span-8 md:col-span-10 text-left">
                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                            <small className="text-text"><strong className="text-hover">Step 2:</strong> Join our Whatsapp group to stay updated with the latest news and events.</small>
                        </div>
                        <div className="col-span-4 md:col-span-2 mr-1">
                            <Button label="" severity="success" raised size="small" className="float-right"
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
                                            <small className="text-text"><strong className="text-hover">Step 3:</strong> Create Profile, Get Gifts on your special occassions, Track your Donations, Offer online Prayers and Associate with Devotees. All at one place.</small>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="danger" raised size="small" className="float-right"
                                                icon="pi pi-crown"
                                                onClick={() => router.push(`/login${searchParams ? `?${searchParams}` : ''}`)} >
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
                                                    <small className="text-text"><strong className="text-hover">Step 3:</strong> Keep your profile 100% and upto date</small>
                                                </div>
                                                <div className="col-span-4 md:col-span-5">
                                                    <ProfileCompletionMeter devotee={devotee} />
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
                                    <div className="grid grid-cols-12 items-center py-1 border-l-1 border-solid border-hover pl-2">
                                        <div className="col-span-8 md:col-span-10 text-left">
                                            <Badge severity="warning" className="scale-150 -ml-3 mr-2"></Badge>
                                            <small className="text-text"><strong className="text-hover">Step 4:</strong> Let&apos;s Spread the word. Refer Others and become a spiritual catalyst in their life.</small>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 mr-1">
                                            <Button label="" severity="secondary" raised size="small" className="float-right"
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
            <span className={classNames("absolute right-0 md:right-2 z-1", guestMode ? 'top-[7vh] md:top-[8.8vh]' : 'top-[17vh] md:top-[13.5vh]')}>
                <Button
                    rounded
                    raised
                    className="hover:animate-pulse"
                    severity="secondary"
                    aria-label="Steps"
                    size="small"
                    title="Open Welcome Page again to checkout mandatory Steps."
                    onClick={() => setShowWelcomeDialogue(true)}
                >
                    <i className="pi pi-bell cursor-pointer text-white p-overlay-badge">
                        <Badge severity="danger" className="scale-50"></Badge>
                    </i>
                </Button>
            </span>

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