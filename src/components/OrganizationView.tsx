"use client";

import React, { useEffect, useState } from 'react';
import { OrganizationChart } from 'primereact/organizationchart';
import { TreeNode } from 'primereact/treenode';
import api from '@/lib/axios';
import { ProgressBar } from 'primereact/progressbar';
import { useRouter } from 'next/navigation';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { DevoteeCard } from './DevoteeCard';

// Extend TreeNode to avoid strict type checking issues if standard type is missing properties
interface CustomTreeNode extends TreeNode {
    type?: string;
}

interface OrgDevotee {
    id: number;
    name: string | null;
    leader_id: number | null;
    system_role_id: number | null;
    gender: string | null;
    phone: string | null;
    system_role_id_ref_value: {
        name: string;
    };
    spiritual_level_id_ref_value: {
        title_male: string;
        title_female: string;
        title_other: string;
    };
    // Helper to store children directly in data for the "Members List" node approach
    directReports?: OrgDevotee[];
}

export default function OrganizationView({ refreshTrigger }: { refreshTrigger?: number }) {
    // Store Admins separately
    const [admins, setAdmins] = useState<OrgDevotee[]>([]);
    // Store Leader Trees
    const [leaderTrees, setLeaderTrees] = useState<CustomTreeNode[][]>([]);
    const [loading, setLoading] = useState(true);
    const [showDevoteeModal, setShowDevoteeModal] = useState<boolean>(false);
    const [selectedDevoteeId, setSelectedDevoteeId] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, [refreshTrigger]);

    const fetchData = async () => {
        try {
            const res = await api.get('/organization');
            if (res.data.success) {
                const devotees: OrgDevotee[] = res.data.devotees;

                // 1. Extract Admins
                const adminList = devotees.filter(d => (d.system_role_id || 0) === 4);
                setAdmins(adminList);

                // 2. Build Trees starting from Leaders
                const trees = buildLeaderTrees(devotees);
                setLeaderTrees(trees);
            }
        } catch (error) {
            console.error("Failed to fetch organization data", error);
        } finally {
            setLoading(false);
        }
    };

    const buildLeaderTrees = (devotees: OrgDevotee[]): CustomTreeNode[][] => {
        const devoteeMap = new Map<number, OrgDevotee>();

        // 1. Map all devotees and initialize directReports
        devotees.forEach(d => {
            devoteeMap.set(d.id, { ...d, directReports: [] });
        });

        // 2. Build hierarchy in data objects
        // We only care about linking:
        // - Member -> Leader
        // - Leader -> Leader
        // We DO NOT link Leader -> Admin here, because Admins are shown separately.
        devotees.forEach(d => {
            // Skip if current is Admin (they are not in the tree)
            if ((d.system_role_id || 0) === 4) return;

            if (d.leader_id && devoteeMap.has(d.leader_id)) {
                const leader = devoteeMap.get(d.leader_id);
                // Only link if the leader is NOT an Admin (i.e. is a Leader)
                if (leader && (leader.system_role_id || 0) !== 4) {
                    const current = devoteeMap.get(d.id);
                    if (current) {
                        leader.directReports?.push(current);
                    }
                }
            }
        });

        // 3. Recursive function to create nodes
        const createNode = (d: OrgDevotee): CustomTreeNode => {
            const node: CustomTreeNode = {
                key: String(d.id),
                expanded: true,
                type: 'person',
                className: 'bg-transparent border-none p-0',
                data: d,
                children: []
            };

            if (d.directReports && d.directReports.length > 0) {
                // Separate reports into Leaders and Members
                const subLeaders = d.directReports.filter(r => (r.system_role_id || 0) === 3);
                const members = d.directReports.filter(r => (r.system_role_id || 0) < 3);

                // Add sub-leaders as normal child nodes
                subLeaders.forEach(sl => {
                    node.children?.push(createNode(sl));
                });

                // Group members into a single "Members List" node
                if (members.length > 0) {
                    node.children?.push({
                        key: `${d.id}_members`,
                        expanded: true,
                        className: 'bg-transparent border-none p-0',
                        data: { members },
                        children: []
                    });
                }
            }

            return node;
        };

        // 4. Identify Root Leaders
        // A Root Leader is a Leader (role=3) who:
        // - Has no leader_id OR
        // - Has a leader_id that points to an Admin OR
        // - Has a leader_id that does not exist in our map
        const rootLeaders = devotees.filter(d => {
            if ((d.system_role_id || 0) !== 3) return false; // Must be a Leader

            if (!d.leader_id) return true; // No leader -> Root

            const leader = devoteeMap.get(d.leader_id);
            if (!leader) return true; // Leader not found -> Root

            // If the parent leader is NOT a Leader (e.g. Admin, Member, Volunteer), then this Leader is a Root of a Leader Tree
            // This handles cases where a Leader is assigned to an Admin (standard) or a Member (edge case), ensuring they show up.
            if ((leader.system_role_id || 0) !== 3) return true;

            return false; // Leader is another Leader -> Not Root
        });

        // 5. Build a tree for each Root Leader
        const trees: CustomTreeNode[][] = [];
        rootLeaders.forEach(leader => {
            const enrichedLeader = devoteeMap.get(leader.id);
            if (enrichedLeader) {
                trees.push([createNode(enrichedLeader)]);
            }
        });

        return trees;
    };

    const openDevoteeModal = (id: number) => {
        setSelectedDevoteeId(id);
        setShowDevoteeModal(true);
    };

    const nodeTemplate = (node: CustomTreeNode) => {
        if (node.data.members || node.type === 'members_list') {
            return <MembersListNode members={node.data.members} onMemberClick={openDevoteeModal} />;
        }

        const d = node.data as OrgDevotee;
        const isLeader = d.system_role_id === 3;
        const isAdmin = d.system_role_id === 4;

        let headerColor = 'bg-gray-500';
        let headerText = 'Member';

        if (isAdmin) {
            headerColor = 'bg-red-600';
            headerText = 'Admin';
        } else if (isLeader) {
            headerColor = 'bg-cyan-600';
            headerText = 'Leader';
        }

        return (
            <div className="flex flex-col w-48 bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-100"
                onClick={() => openDevoteeModal(d.id)}
            >
                <div className={`${headerColor} p-3 flex flex-col items-center justify-center text-white`}>
                    <Avatar
                        image={undefined}
                        label={d.name?.charAt(0).toUpperCase()}
                        shape="circle"
                        size="large"
                        className="bg-white/20 text-white mb-2 border-2 border-white/30"
                    />
                    <span className="font-bold text-sm text-center line-clamp-1">{d.name}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">{headerText}</span>
                </div>
            </div>
        );
    };

    if (loading) {
        return <ProgressBar mode="indeterminate" style={{ height: '2px' }} />;
    }

    return (
        <div className="mt-6 overflow-hidden flex flex-col bg-gray-50/50">
            <div className="mb-6 flex justify-between items-center px-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Organization Structure</h2>
                </div>
                <div className="flex gap-3 items-center">
                    <Button
                        icon="pi pi-refresh"
                        rounded
                        text
                        severity="secondary"
                        aria-label="Refresh"
                        onClick={() => {
                            setLoading(true);
                            fetchData();
                        }}
                    />
                    <div className="flex gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                            <div className="w-3 h-3 rounded-full bg-red-600"></div>
                            <span className="text-gray-600 font-medium">Admin</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                            <div className="w-3 h-3 rounded-full bg-cyan-600"></div>
                            <span className="text-gray-600 font-medium">Leader</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-auto rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-sm shadow-inner p-8 mx-6 mb-6">
                {/* Admins Section */}
                {admins.length > 0 && (
                    <div className="mb-12">
                        <div className="flex flex-wrap justify-center gap-6">
                            {admins.map(admin => (
                                <div key={admin.id}
                                    className="flex flex-col w-48 bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-100"
                                    onClick={() => openDevoteeModal(admin.id)}
                                >
                                    <div className="bg-red-600 p-3 flex flex-col items-center justify-center text-white">
                                        <Avatar
                                            label={admin.name?.charAt(0).toUpperCase()}
                                            shape="circle"
                                            size="large"
                                            className="bg-white/20 text-white mb-2 border-2 border-white/30"
                                        />
                                        <span className="font-bold text-sm text-center line-clamp-1">{admin.name}</span>
                                        <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Admin</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Connector Line Visual (Optional, just spacing for now) */}
                        <div className="w-full border-b border-gray-200 mt-8 mb-4 relative">
                            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-gray-50 px-2 text-xs text-gray-400">Leaders</span>
                        </div>
                    </div>
                )}

                {/* Leader Trees Section */}
                <div className="flex flex-wrap justify-center gap-12 items-start">
                    {leaderTrees.length > 0 ? (
                        leaderTrees.map((tree, index) => (
                            <div key={index} className="flex-shrink-0">
                                <OrganizationChart
                                    value={tree}
                                    nodeTemplate={nodeTemplate}
                                    className="company-org-chart"
                                />
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-400 mt-4">
                            No leadership structures found.
                        </div>
                    )}
                </div>
            </div>

            {/* Devotee Card Modal */}
            <Dialog
                header="Devotee Details"
                visible={showDevoteeModal}
                onHide={() => setShowDevoteeModal(false)}
                className="w-full max-w-lg"
                contentClassName="p-0" // Remove padding to let card fit nicely
            >
                {selectedDevoteeId && (
                    <div className="p-3">
                        <DevoteeCard devoteeId={selectedDevoteeId} />
                    </div>
                )}
            </Dialog>

            <style jsx global>{`
                .p-organizationchart {
                    background: transparent;
                }
                .p-organizationchart .p-organizationchart-node-content {
                    background: transparent;
                    border: none;
                    padding: 0.5rem;
                }
                .p-organizationchart-line-down {
                    background: #e2e8f0 !important;
                }
                .p-organizationchart-line-left {
                    border-color: #e2e8f0 !important;
                }
                .p-organizationchart-line-top {
                    border-color: #e2e8f0 !important;
                }
                .p-organizationchart-node-content .p-node-toggler {
                    background: #fff !important;
                    border: 1px solid #e2e8f0 !important;
                    color: #64748b !important;
                    width: 1.5rem;
                    height: 1.5rem;
                    margin-top: -0.75rem;
                }
                .p-organizationchart-node-content .p-node-toggler:focus {
                    box-shadow: 0 0 0 2px #e2e8f0;
                }
            `}</style>
        </div>
    );
}

// Separate component for Members List to handle internal state (collapse/expand)
function MembersListNode({ members, onMemberClick }: { members: OrgDevotee[], onMemberClick: (id: number) => void }) {
    const [collapsed, setCollapsed] = useState(true);


    return (
        <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden min-w-[200px] transition-all">
            <div
                className="bg-gray-50 p-2 border-b border-gray-200 font-semibold text-xs text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:bg-gray-100 flex justify-between items-center px-4"
                onClick={(e) => {
                    e.stopPropagation();
                    setCollapsed(!collapsed);
                }}
            >
                <span>Members ({members.length})</span>
                <i className={`pi ${collapsed ? 'pi-chevron-down' : 'pi-chevron-up'} text-[10px]`}></i>
            </div>

            {!collapsed && (
                <div className="flex flex-col p-1 max-h-[300px] overflow-y-auto animate-fade-in">
                    {members.map(m => (
                        <div
                            key={m.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors border-b last:border-b-0 border-gray-100"
                            onClick={() => onMemberClick(m.id)}
                        >
                            <Avatar
                                label={m.name?.charAt(0).toUpperCase()}
                                shape="circle"
                                size="normal"
                                className="bg-gray-100 text-gray-600 flex-shrink-0 w-8 h-8 text-xs"
                            />
                            <span className="text-sm text-gray-700 truncate">{m.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}