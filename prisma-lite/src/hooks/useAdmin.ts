export function useAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}