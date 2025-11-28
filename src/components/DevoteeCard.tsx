import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Devotee } from "@/lib/conversions";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { SYSTEM_ROLES, STATUSES } from "@/data/constants";

interface DevoteeCardProps {
    devotee: Devotee;
    systemRole: string | undefined;
    onRoleUpdate: (devotee: Devotee, newRoleId: number, newRoleName: string) => void;
}

export const DevoteeCard: React.FC<DevoteeCardProps> = ({ devotee, systemRole, onRoleUpdate }) => {
    const router = useRouter();
    const menu = useRef<Menu>(null);

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

    return (
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
                                <h3 className="text-lg font-bold text-gray-800 line-clamp-1" title={devotee.name || ''}>
                                    {devotee.name}
                                </h3>
                                {devotee.status === 'active' && (
                                    <i className="pi pi-check-circle text-green-500 text-sm" title="Verified and Active Member"></i>
                                )}
                            </div>
                            <div className="flex gap-2 mt-1">
                                {devotee.system_role_id && devotee.system_role_id > 1 && (
                                    <Tag
                                        severity={devotee.system_role_id >= 4 ? 'danger' : devotee.system_role_id >= 3 ? 'warning' : 'info'}
                                        value={devotee.system_role_id_ref_value?.name}
                                        className="text-xs px-2 py-0.5"
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
                <div className="space-y-3 mb-5">
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
                        icon="pi pi-heart"
                        label="Donations"
                        onClick={() => router.push(`/user-data?tab=1&phone=${devotee.phone}`)}
                        size="small"
                        severity="warning"
                        className="w-full !text-sm"
                    />
                </div>
            </div>
        </div>
    );
};
