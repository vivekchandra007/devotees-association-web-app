import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Devotee } from "@/lib/conversions";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { confirmDialog } from 'primereact/confirmdialog';
import { SYSTEM_ROLES, STATUSES } from "@/data/constants";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import api from "@/lib/axios";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DevoteeCardProps {
    devoteeId: number;
    initialData?: Devotee;
    onDataChange?: (devotee: Devotee) => void;
    // Optional context to avoid refetching if already known, 
    // but the card should work without them if systemRole/currentDevoteeId are fetched from useAuth
    systemRole?: string;
    currentDevoteeId?: number;
}

export const DevoteeCard: React.FC<DevoteeCardProps> = ({
    devoteeId,
    initialData,
    onDataChange,
    systemRole: propSystemRole,
    currentDevoteeId: propCurrentDevoteeId
}) => {
    const router = useRouter();
    const { devotee: loggedInDevotee, systemRole: authSystemRole } = useAuth();

    // Prioritize props if passed (e.g. from parent optimization), else fallback to auth hook
    const systemRole = propSystemRole || authSystemRole;
    const currentDevoteeId = propCurrentDevoteeId || loggedInDevotee?.id;

    const [devotee, setDevotee] = useState<Devotee | null>(initialData || null);
    const [loading, setLoading] = useState<boolean>(false);

    const menu = useRef<Menu>(null);
    const [showLeaderDialog, setShowLeaderDialog] = useState(false);
    const [showAssignLeaderDialog, setShowAssignLeaderDialog] = useState(false);
    const [leaderSuggestions, setLeaderSuggestions] = useState<Devotee[]>([]);
    const [selectedLeader, setSelectedLeader] = useState<Devotee | null>(null);

    useEffect(() => {
        const fetchDevoteeData = async () => {
            // Only fetch if we have an ID
            if (!devoteeId) return;

            setLoading(true);
            try {
                const res = await api.get(`/devotee?devoteeId=${devoteeId}`);
                if (res.status === 200 && res.data.devotee) {
                    setDevotee(res.data.devotee);
                }
            } catch (error) {
                console.error("Failed to fetch devotee data", error);
                toast.error("Failed to load devotee details.");
            } finally {
                setLoading(false);
            }
        };

        if (!initialData && devoteeId) {
            fetchDevoteeData();
        } else if (initialData) {
            setDevotee(initialData);
        }
    }, [devoteeId, initialData]);

    const searchLeaders = async (event: AutoCompleteCompleteEvent) => {
        try {
            const res = await api.get('/devotees', {
                params: {
                    query: event.query,
                    role_id: 3 // Filter for leaders only
                }
            });
            if (res.status === 200) {
                setLeaderSuggestions(res.data);
            }
        } catch (error) {
            console.error("Failed to search leaders", error);
            setLeaderSuggestions([]);
        }
    };

    const updateDevoteeRole = async (newRoleId: number, newRoleName: string) => {
        if (!devotee) return;
        const previousDevotee = { ...devotee };

        try {
            // Optimistic update
            const updatedDevotee = {
                ...devotee,
                system_role_id: newRoleId,
                system_role_id_ref_value: { name: newRoleName.toLocaleLowerCase() } // Temporary mock for UI
            };
            setDevotee(updatedDevotee);

            const res = await api.post('/devotee', { id: devotee.id, system_role_id: newRoleId });
            if (res.status === 200 && res.data.success) {
                toast.success(`Role Updated: ${devotee.name} is now a ${newRoleName}`);
                // Fetch fresh data to ensure consistency (e.g. correct role name formatting)
                // Or if we trust the API response to return the object, we can use that.
                // For now, we rely on the optimistic update + notification.
                // Ideally, if onDataChange is provided, we call it.
                if (onDataChange) onDataChange(updatedDevotee);
            } else {
                throw new Error(res.data.error || 'Failed');
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to update role';
            toast.error(errorMessage);
            setDevotee(previousDevotee); // Revert
        }
    };

    const updateDevoteeLeader = async (newLeaderId: number | null) => {
        if (!devotee) return;
        const previousDevotee = { ...devotee };

        try {
            // Optimistic Update
            const updatedDevotee = {
                ...devotee,
                leader_id: newLeaderId,
                // If assigning to self, we can mock the leader ref value
                leader_id_ref_value: newLeaderId === currentDevoteeId
                    ? { id: currentDevoteeId || 0, name: loggedInDevotee?.name || 'Me' } // Safe fallbacks
                    : (newLeaderId ? { id: newLeaderId, name: selectedLeader?.name || 'Leader' } : null)
            };
            setDevotee(updatedDevotee);

            const res = await api.post('/devotee', { id: devotee.id, leader_id: newLeaderId });
            if (res.status === 200 && res.data.success) {
                const action = newLeaderId ? 'Assigned to leader' : 'Removed from leadership';
                toast.success(`Leader Updated: ${devotee.name} has been ${action}`);
                if (onDataChange) onDataChange(updatedDevotee);
            } else {
                throw new Error(res.data.error || 'Failed');
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to update leader';
            toast.error(errorMessage);
            setDevotee(previousDevotee); // Revert
        }
    };

    const confirmRoleUpdate = (newRoleId: number, newRoleName: string) => {
        if (!devotee) return;

        // Check validation for demoting a leader
        // Need to check if we have the _count property. If not (e.g. simplified initialData), 
        // we might need to fetch it or rely on API to error out.
        // However, the current requirement implies client-side check if possible.
        // If initialData came from the new API, it should have _count.
        const devoteeWithCount = devotee as Devotee & { _count?: { other_devotees_devotees_leader_idTodevotees: number } };

        if (newRoleId < 3 && (devoteeWithCount._count?.other_devotees_devotees_leader_idTodevotees || 0) > 0) {
            toast.error(`Cannot Demote Leader: ${devotee.name} has ${devoteeWithCount._count?.other_devotees_devotees_leader_idTodevotees} members assigned. Please reassign members first.`);
            return;
        }

        confirmDialog({
            message: `Are you sure you want to change ${devotee.name}'s role to a ${newRoleName}?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => updateDevoteeRole(newRoleId, newRoleName)
        });
    };

    const getInitials = (name: string) => {
        if (!name) return '';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (!devotee) {
        return loading ? <div className="p-4 rounded-xl border border-gray-100 bg-white animate-pulse h-48"></div> : null;
    }

    const adminMenuItems: MenuItem[] = [];

    if (systemRole === SYSTEM_ROLES.admin || systemRole === SYSTEM_ROLES.leader) {
        if ((devotee.system_role_id || 0) < 2) {
            adminMenuItems.push({
                label: 'Add as Volunteer',
                icon: 'pi pi-user-plus',
                command: () => confirmRoleUpdate(2, 'Volunteer')
            });
        }
        if ((devotee.system_role_id === 2)) {
            adminMenuItems.push({
                label: 'Remove from Volunteer',
                icon: 'pi pi-user-minus',
                className: 'text-red-500',
                command: () => confirmRoleUpdate(1, 'Member')
            });
        }
    }

    if (systemRole === SYSTEM_ROLES.admin) {
        if ((devotee.system_role_id || 0) < 3) {
            adminMenuItems.push({
                label: 'Promote as Leader',
                icon: 'pi pi-angle-double-up',
                command: () => confirmRoleUpdate(3, 'Leader')
            });
        }
        if ((devotee.system_role_id === 3)) {
            adminMenuItems.push({
                label: 'Demote from Leader',
                icon: 'pi pi-angle-double-down',
                className: 'text-red-500',
                command: () => confirmRoleUpdate(2, 'Volunteer')
            });
        }

        // Assign/Unassign Leader Logic
        if ((devotee.system_role_id || 0) < 4) {
            if (!devotee.leader_id) {
                adminMenuItems.push({
                    label: 'Assign to Leader',
                    icon: 'pi pi-users',
                    command: () => {
                        setSelectedLeader(null);
                        setShowAssignLeaderDialog(true);
                    }
                });
            } else {
                adminMenuItems.push({
                    label: 'Unassign Leader',
                    icon: 'pi pi-user-minus',
                    className: 'text-red-500',
                    command: () => {
                        confirmDialog({
                            message: `Are you sure you want to unassign ${devotee.name} from their current leader?`,
                            header: 'Confirm Unassignment',
                            icon: 'pi pi-exclamation-triangle',
                            accept: () => updateDevoteeLeader(null)
                        });
                    }
                });
            }
        }
    }

    if (devotee.id !== currentDevoteeId && (systemRole === SYSTEM_ROLES.admin || systemRole === SYSTEM_ROLES.leader) && (devotee.system_role_id || 0) < 4) {
        // Case 1: Devotee has no leader assigned
        if (!devotee.leader_id) {
            // "Assign under me" should not be shown to an admin
            if (systemRole !== SYSTEM_ROLES.admin) {
                adminMenuItems.push({
                    label: 'Assign under me',
                    icon: 'pi pi-user-plus',
                    command: () => {
                        confirmDialog({
                            message: `Are you sure you want to take ${devotee.name} under your leadership?`,
                            header: 'Confirm Assignment',
                            icon: 'pi pi-exclamation-triangle',
                            accept: () => updateDevoteeLeader(currentDevoteeId || null)
                        });
                    }
                });
            }
        }
        // Case 2: Devotee is assigned to current logged in user
        else if (devotee.leader_id === currentDevoteeId) {
            adminMenuItems.push({
                label: 'Remove from my leadership',
                icon: 'pi pi-user-minus',
                className: 'text-red-500',
                command: () => {
                    confirmDialog({
                        message: `Are you sure you want to remove ${devotee.name} from your leadership?`,
                        header: 'Confirm Removal',
                        icon: 'pi pi-exclamation-triangle',
                        accept: () => updateDevoteeLeader(null)
                    });
                }
            });
        }
        // Case 3: Devotee is assigned to someone else
        else {
            adminMenuItems.push({
                label: 'Show Leader Information',
                icon: 'pi pi-info-circle',
                command: () => setShowLeaderDialog(true)
            });
        }
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden relative">
                {devotee.status === STATUSES.deceased && (
                    <div className="absolute inset-0 bg-gray-100/80 z-10 flex items-center justify-center">
                        <i className="pi pi-lock text-4xl text-gray-400"></i>
                    </div>
                )}

                <div className="p-5">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <Avatar
                                label={getInitials(devotee.name || '')}
                                shape="circle"
                                size="large"
                                className="bg-orange-100 text-orange-600 font-bold"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="capitalize text-lg font-bold text-gray-800 line-clamp-1" title={devotee.name || ''}>
                                        {devotee.name?.toLocaleLowerCase()}
                                    </h3>
                                    {devotee.status === 'active' && (
                                        <i className="pi pi-check-circle text-green-500 text-sm" title="Verified and Active Member"></i>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 [zoom:0.9]">
                                    {devotee.id === currentDevoteeId && (
                                        <Tag
                                            severity="warning"
                                            value="You"
                                        />
                                    )}
                                    {devotee.system_role_id && devotee.system_role_id > 1 && (
                                        <Tag
                                            icon={`pi pi-user`}
                                            severity={devotee.system_role_id >= 4 ? 'danger' : devotee.system_role_id >= 3 ? 'info' : 'contrast'}
                                            value={devotee.system_role_id_ref_value?.name}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {adminMenuItems.length > 0 && (
                            <>
                                <Menu model={adminMenuItems} popup ref={menu} id={`menu_${devotee.id}`} />
                                <Button
                                    icon="pi pi-ellipsis-v"
                                    rounded
                                    text
                                    severity="secondary"
                                    aria-label="Options"
                                    onClick={(event) => menu.current?.toggle(event)}
                                    aria-controls={`menu_${devotee.id}`}
                                    aria-haspopup
                                />
                            </>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-3 justify-between mb-5">
                        <div className="flex items-center gap-3 text-gray-600 group cursor-pointer" onClick={() => window.open(`tel:${devotee.phone}`)}>
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <i className="pi pi-phone text-blue-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-medium">{devotee.phone?.slice(2)}</span>
                        </div>

                        {devotee.email && (
                            <div className="flex items-center gap-3 text-gray-600 group cursor-pointer" onClick={() => window.open(`mailto:${devotee.email}`)}>
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                    <i className="pi pi-envelope text-purple-500 text-sm"></i>
                                </div>
                                <span className="text-sm truncate" title={devotee.email}>{devotee.email}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            outlined
                            icon="pi pi-user"
                            label="Profile"
                            onClick={() => router.push(`/devotee?devoteeId=${devotee.id}`)}
                            size="small"
                            className="w-full !text-sm"
                        />
                        <Button
                            outlined
                            icon="pi pi-indian-rupee"
                            label="Donations"
                            onClick={() => router.push(`/user-data?tab=2&phone=${devotee.phone}`)}
                            size="small"
                            severity="warning"
                            className="w-full !text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* We can place ConfirmDialog here or expect parent to have it. 
                But to be self-sufficient, putting it here is safer if multiple cards don't conflict.
                However, multiple ConfirmDialogs in DOM can be an issue if they mount portals.
                PrismaReact <ConfirmDialog /> attaches to window/document events. 
                Ideally, there should be one global one. 
                I'll assume the one in Dashboard/Page is enough, or if this is standalone, we might need one.
                Since the Prompt asked for "self-sufficient", and we want it to work anywhere...
                I will only embed logic to TRIGGER it. The <ConfirmDialog /> component in layout or page listens.
                But if I use a raw usage somewhere else without <ConfirmDialog /> in tree, it won't work.
                Safest: Place one if I can ensure it doesn't duplicate awkwardly. 
                Actually, PrimeReact recommends one <ConfirmDialog> per application usually.
                I will SKIP adding <ConfirmDialog /> JSX here and assume the app has provided it, 
                OR add it but ensure it doesn't conflict. 
                For now, I'll rely on global/page level presence to avoid 'multiple confirm dialogs found' errors.
            */}

            {/* Leader Info Dialog */}
            <Dialog
                header="Leader Information"
                visible={showLeaderDialog}
                onHide={() => setShowLeaderDialog(false)}
                className="w-full max-w-md"
            >
                {devotee.leader_id_ref_value ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Avatar
                                label={getInitials(devotee.leader_id_ref_value.name || '')}
                                shape="circle"
                                size="large"
                                className="bg-blue-100 text-blue-600"
                            />
                            <div>
                                <h3 className="font-bold text-lg capitalize">{devotee.leader_id_ref_value.name}</h3>
                                <Tag value="Leader" severity="info" />
                            </div>
                        </div>
                        <Button
                            label="View Full Profile"
                            icon="pi pi-external-link"
                            outlined
                            onClick={() => {
                                setShowLeaderDialog(false);
                                router.push(`/devotee?devoteeId=${devotee.leader_id}`);
                            }}
                        />
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No leader information available.</p>
                )}
            </Dialog>

            {/* Assign Leader Dialog */}
            <Dialog
                header="Assign to a Leader"
                visible={showAssignLeaderDialog}
                onHide={() => setShowAssignLeaderDialog(false)}
                className="w-full max-w-md"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button label="Cancel" icon="pi pi-times" text onClick={() => setShowAssignLeaderDialog(false)} />
                        <Button
                            label="Assign"
                            icon="pi pi-check"
                            disabled={!selectedLeader}
                            onClick={() => {
                                if (selectedLeader) {
                                    updateDevoteeLeader(selectedLeader.id);
                                    setShowAssignLeaderDialog(false);
                                }
                            }}
                        />
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600">
                        Search and select a leader to assign <strong>{devotee.name}</strong> to:
                    </p>
                    <div className="flex flex-col gap-2">
                        <AutoComplete
                            inputId="leader-search"
                            value={selectedLeader as Devotee}
                            suggestions={leaderSuggestions}
                            completeMethod={searchLeaders}
                            field="name"
                            onChange={(e) => setSelectedLeader(e.value)}
                            placeholder="Start typing leader name..."
                            itemTemplate={(item: Devotee) => (
                                <div className="flex items-center gap-2">
                                    <Avatar label={getInitials(item.name || '')} shape="circle" size="normal" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-xs text-gray-500">{item.phone?.slice(2)}</span>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                    {selectedLeader && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="text-xs text-blue-600 font-bold uppercase mb-1">Selected Leader</div>
                            <div className="flex items-center gap-2">
                                <Avatar label={getInitials(selectedLeader.name || '')} shape="circle" className="bg-blue-200 text-blue-700" />
                                <div>
                                    <div className="font-bold text-sm">{selectedLeader.name}</div>
                                    <div className="text-xs text-gray-600">{selectedLeader.phone}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>
        </>
    );
};
