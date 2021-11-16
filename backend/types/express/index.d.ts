import { User } from "../../model/user";

declare global {
  namespace Express {
    export interface Request {
      user: User;
    }
    export interface Response {
      user: User;
    }
  }
}
