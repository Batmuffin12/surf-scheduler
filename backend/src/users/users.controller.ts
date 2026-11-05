import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { isValidObjectId } from 'mongoose'
import { User } from './user.schema'
import { UsersService } from './users.service'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The API shape of a user (docs/openapi.yaml `User`). */
function toApiUser(user: User & { _id: unknown }) {
  return { id: String(user._id), email: user.email, createdAt: user.createdAt }
}

function validEmail(value: unknown): string {
  const email = typeof value === 'string' ? value.trim() : ''
  if (!EMAIL.test(email)) throw new BadRequestException('A valid email is required')
  return email
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  async create(@Body() body: { email?: unknown }) {
    return toApiUser(await this.users.create(validEmail(body?.email)))
  }

  @Get()
  async findByEmail(@Query('email') email?: unknown) {
    const user = await this.users.findByEmail(validEmail(email))
    if (!user) throw new NotFoundException('No such user')
    return toApiUser(user)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = isValidObjectId(id) ? await this.users.findById(id) : null
    if (!user) throw new NotFoundException('No such user')
    return toApiUser(user)
  }
}
