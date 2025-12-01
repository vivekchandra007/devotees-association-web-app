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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const adminMenuItems: MenuItem[] = [];

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
    }

    if (devotee.id !== currentDevoteeId && (systemRole === SYSTEM_ROLES.admin || systemRole === SYSTEM_ROLES.leader)) {
        // Case 1: Devotee has no leader assigned
        if (!devotee.leader_id) {
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
        </>
    );
};
