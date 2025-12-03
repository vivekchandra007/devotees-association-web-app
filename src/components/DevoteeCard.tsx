import React, { useRef, useState } from 'react';
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

interface DevoteeCardProps {
    devotee: Devotee;
    systemRole: string | undefined;
    onRoleUpdate: (devotee: Devotee, newRoleId: number, newRoleName: string) => void;
    currentDevoteeId?: number;
    onLeaderUpdate: (devoteeId: number, currentName: string, newLeaderId: number | null) => void;
}

export const DevoteeCard: React.FC<DevoteeCardProps> = ({ devotee, systemRole, onRoleUpdate, currentDevoteeId, onLeaderUpdate }) => {
    const router = useRouter();
    const menu = useRef<Menu>(null);
    const [showLeaderDialog, setShowLeaderDialog] = useState(false);
    const [showAssignLeaderDialog, setShowAssignLeaderDialog] = useState(false);
    const [leaderSuggestions, setLeaderSuggestions] = useState<Devotee[]>([]);
    const [selectedLeader, setSelectedLeader] = useState<Devotee | null>(null);

    const getInitials = (name: string) => {
        // ... (existing implementation)
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const searchLeaders = async (event: AutoCompleteCompleteEvent) => {
        try {
            const res = await api.get('/devotees', {
                params: {
                    query: event.query,
                    min_role_id: 3 // Filter for leaders
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

    const adminMenuItems: MenuItem[] = [];

    // ... (existing menu items logic)

    if (systemRole === SYSTEM_ROLES.admin || systemRole === SYSTEM_ROLES.leader) {
        if ((devotee.system_role_id || 0) < 2) {
            adminMenuItems.push({
                label: 'Add as Volunteer',
                icon: 'pi pi-user-plus',
                command: () => onRoleUpdate(devotee, 2, 'Volunteer')
            });
        }
        if ((devotee.system_role_id === 2)) {
            adminMenuItems.push({
                label: 'Remove from Volunteer',
                icon: 'pi pi-user-minus',
                className: 'text-red-500',
                command: () => onRoleUpdate(devotee, 1, 'Member')
            });
        }
    }

    if (systemRole === SYSTEM_ROLES.admin) {
        if ((devotee.system_role_id || 0) < 3) {
            adminMenuItems.push({
                label: 'Promote as Leader',
                icon: 'pi pi-angle-double-up',
                command: () => onRoleUpdate(devotee, 3, 'Leader')
            });
        }
        if ((devotee.system_role_id === 3)) {
            adminMenuItems.push({
                label: 'Demote from Leader',
                icon: 'pi pi-angle-double-down',
                className: 'text-red-500',
                command: () => onRoleUpdate(devotee, 2, 'Volunteer')
            });
        }

        // Assign/Unassign Leader Logic
        // Only allow for non-admins (role < 4)
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
                            accept: () => onLeaderUpdate(devotee.id, devotee.name || '', null)
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
                            accept: () => onLeaderUpdate(devotee.id, devotee.name || '', currentDevoteeId || null)
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
                        accept: () => onLeaderUpdate(devotee.id, devotee.name || '', null)
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
                {/* ... (existing card content) ... */}
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
                            onClick={() => router.push(`/user-data?tab=1&phone=${devotee.phone}`)}
                            size="small"
                            severity="warning"
                            className="w-full !text-sm"
                        />
                    </div>
                </div>
            </div>

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
                header="Assign to Leader"
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
                                    onLeaderUpdate(devotee.id, devotee.name || '', selectedLeader.id);
                                    setShowAssignLeaderDialog(false);
                                }
                            }}
                        />
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600">
                        Search and select a leader to assign <strong>{devotee.name}</strong> to.
                    </p>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="leader-search" className="font-bold text-sm">Search Leader</label>
                        <AutoComplete
                            inputId="leader-search"
                            value={selectedLeader as any}
                            suggestions={leaderSuggestions}
                            completeMethod={searchLeaders}
                            field="name"
                            onChange={(e) => setSelectedLeader(e.value)}
                            placeholder="Type leader name..."
                            itemTemplate={(item: Devotee) => (
                                <div className="flex items-center gap-2">
                                    <Avatar label={getInitials(item.name || '')} shape="circle" size="normal" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-xs text-gray-500">{item.phone}</span>
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
