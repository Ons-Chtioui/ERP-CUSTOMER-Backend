export declare class CreateUserDto {
    nom: string;
    prenom: string;
    email: string;
    password?: string;
    roleId: number;
    permissionIds?: number[];
}
