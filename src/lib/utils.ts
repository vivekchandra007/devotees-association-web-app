export function getCurrentDateDDMMYYYY(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}